import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Structured output schema for the photo analysis. Forcing the model to fill
// this via tool use guarantees valid JSON — the previous free-text + JSON.parse
// approach truncated on busy photos and surfaced as "AI unavailable".
const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    what_i_see: { type: 'string', description: 'One brief sentence describing the photo.' },
    structures: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          visual_label: { type: 'string', description: 'What the feature is, in plain words.' },
          permit_required: { type: 'boolean' },
          permit_id: { type: 'string', description: 'Matching permit id from the provided list, if any.' },
          permit_name: { type: 'string' },
          category: { type: 'string' },
          base_fee: { type: 'number' },
          rate_percentage: { type: 'number' },
          fee_explanation: { type: 'string' },
          hvhz: { type: 'string', description: 'HVHZ note, or empty if not applicable.' },
          noc_required: { type: 'boolean' },
          likely_unpermitted: { type: 'boolean' },
          notes: { type: 'string' },
        },
        required: ['visual_label', 'permit_required'],
      },
    },
    no_permit_needed: { type: 'array', items: { type: 'string' } },
    red_flags: { type: 'array', items: { type: 'string' } },
    next_steps: { type: 'string' },
  },
  required: ['what_i_see', 'structures'],
}

const SUFFIX_MAP: Record<string, string> = {
  'STREET':'ST','AVENUE':'AVE','AVENUES':'AVE','AV':'AVE','DRIVE':'DR','COURT':'CT','COURTS':'CT',
  'TERRACE':'TER','TERRACES':'TER','TERR':'TER','BOULEVARD':'BLVD','BOULV':'BLVD',
  'ROAD':'RD','WAY':'WAY','CIRCLE':'CIR','CIRC':'CIR','PLACE':'PL','LANE':'LN','HIGHWAY':'HWY',
  'MANOR':'MNR','MANORS':'MNR','PARKWAY':'PKWY','PKWAY':'PKWY','PKY':'PKWY','TRAIL':'TRL',
  'POINT':'PT','CAUSEWAY':'CSWY','SQUARE':'SQ','EXTENSION':'EXT','HOLLOW':'HOLW',
  'CRESCENT':'CRES','ALLEY':'ALY','LANDING':'LNDG','STR':'ST','BL':'BLVD',
}

const SITUS_CITY_MAP: Record<string, string> = {
  'WS':'Weston','CS':'Coral Springs','FL':'Fort Lauderdale','HW':'Hollywood',
  'CY':'Cooper City','SU':'Sunrise','PA':'Parkland','MM':'Miramar',
  'PB':'Pembroke Pines','PI':'Pembroke Pines','DB':'Deerfield Beach',
  'PL':'Plantation','TM':'Tamarac','DV':'Davie','LH':'Lauderhill',
  'DN':'Dania Beach','CK':'Coconut Creek','OP':'Oakland Park',
  'HA':'Hallandale Beach','MG':'Margate','LL':'Lauderdale Lakes',
  'NL':'North Lauderdale','LS':'Lauderdale-by-the-Sea','LP':'Lighthouse Point',
  'WM':'Wilton Manors','WP':'West Park','SW':'Southwest Ranches',
  'HB':'Hillsboro Beach','PK':'Pembroke Park','SL':'Sea Ranch Lakes',
  'LZ':'Lazy Lake','BC':'Unincorporated Broward',
}

const SKIP = new Set(['93','94','95','96','97','98','99','00','10','20','30','40','88','89','86'])

function norm(raw: string): string {
  let q = raw.toUpperCase().trim().replace(/\b(\d+)(?:ST|ND|RD|TH)\b/g,'$1')
  return q.split(/\s+/).map(w => SUFFIX_MAP[w]??w).join(' ')
}

const toRad = (d:number) => d*Math.PI/180
function hav(la1:number,lo1:number,la2:number,lo2:number){
  const R=3958.8,dL=toRad(la2-la1),dO=toRad(lo2-lo1)
  const a=Math.sin(dL/2)**2+Math.cos(toRad(la1))*Math.cos(toRad(la2))*Math.sin(dO/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

function validBuilding(p:any):boolean{
  if(!p||SKIP.has(p.USE_CODE)) return false
  if(!/^\d/.test((p.full_address||'').trim())) return false
  if(Number(p.BLDG_TOT_SQ_FOOTAGE||0)===0&&Number(p.BLDG_YEAR_BUILT||0)===0) return false
  return true
}

function resolveCity(prop:any,gm:any):string{
  if(prop?.SITUS_CITY&&SITUS_CITY_MAP[prop.SITUS_CITY]) return SITUS_CITY_MAP[prop.SITUS_CITY]
  if(prop?.city_name&&prop.city_name!=='Unincorporated Broward') return prop.city_name
  const loc=gm?.results?.[0]?.address_components?.find((c:any)=>c.types.includes('locality'))?.long_name
  return loc||'Broward County'
}

Deno.serve(async (req:Request)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:CORS})

  const sb=createClient(Deno.env.get('SUPABASE_URL')??'',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'')
  const gmKey=Deno.env.get('GOOGLE_MAPS_API_KEY')??''
  const claudeKey=Deno.env.get('ANTHROPIC_API_KEY')??''
  const COLS='FOLIO_NUMBER,full_address,city_name,SITUS_CITY,use_type_label,USE_CODE,BLDG_YEAR_BUILT,BEDS,BATHS,BLDG_TOT_SQ_FOOTAGE,BLDG_UNDER_AIR_SQ_FOOTAGE,SITUS_ZIP_CODE,latitude,longitude'

  const googleGeo=async(la:number,lo:number)=>{
    if(!gmKey) return null
    try{return(await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${la},${lo}&key=${gmKey}`)).json()}
    catch{return null}
  }

  const nomGeo=async(la:number,lo:number)=>{
    try{return(await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${lo}&format=json&addressdetails=1`,{headers:{'User-Agent':'OpenPermit/1.0'}})).json()}
    catch{return null}
  }

  const gmAddr=(gm:any):string=>{
    if(!gm?.results?.[0]) return ''
    const c=gm.results[0].address_components
    const num=c.find((x:any)=>x.types.includes('street_number'))?.long_name||''
    const str=c.find((x:any)=>x.types.includes('route'))?.long_name||''
    return num?norm(`${num} ${str}`.trim()):''
  }

  const findProp=async(la:number,lo:number)=>{
    const d=0.003
    const{data:near}=await sb.from('broward_properties_public').select(COLS)
      .gte('latitude',la-d).lte('latitude',la+d).gte('longitude',lo-d).lte('longitude',lo+d)
      .not('latitude','is',null).limit(20)
    if(near?.length){
      const v=near.filter(validBuilding)
      if(v.length){
        const s=v.map(p=>({...p,_d:hav(la,lo,Number(p.latitude),Number(p.longitude))})).sort((a,b)=>a._d-b._d)
        const gm=await googleGeo(la,lo)
        return{prop:s[0],method:'gps',gm}
      }
    }
    const gm=await googleGeo(la,lo)
    const ga=gmAddr(gm)
    if(ga.length>=5){
      const{data:r}=await sb.from('broward_properties_public').select(COLS).ilike('full_address',`${ga}%`).limit(5)
      const v=(r||[]).filter(validBuilding)
      if(v.length) return{prop:v[0],method:'gm',gm}
    }
    const nom=await nomGeo(la,lo)
    const na=norm(`${nom?.address?.house_number||''} ${nom?.address?.road||''}`.trim())
    if(na.length>=5){
      const{data:r}=await sb.from('broward_properties_public').select(COLS).ilike('full_address',`${na}%`).limit(5)
      const v=(r||[]).filter(validBuilding)
      if(v.length) return{prop:v[0],method:'nom',gm}
    }
    return{prop:null,method:'none',gm}
  }

  const getHistory=async(folio:string,city:string)=>{
    if(!folio||city.toLowerCase()!=='weston') return []
    const{data}=await sb.from('weston_permit_records')
      .select('permit_type,status,issued_date').eq('folio_number',folio)
      .order('issued_date',{ascending:false}).limit(5)
    return data||[]
  }

  try{
    const body=await req.json()
    const{action,lat,lng,image_base64,city_name}=body

    // ── getZoning ────────────────────────────────────────────────────────────
    if(action==='getZoning'){
      if(!lat||!lng) return new Response(JSON.stringify({success:false,error:'lat/lng required'}),{status:400,headers:{...CORS,'Content-Type':'application/json'}})
      const{prop,method,gm}=await findProp(lat,lng)
      const city=resolveCity(prop,gm)
      const[{data:cd},{data:zones}]=await Promise.all([
        sb.from('cities').select('name,slug,building_department_phone,portal_url').ilike('name',`%${city}%`).limit(1).single(),
        sb.from('zoning_rules').select('*').ilike('city_name',`%${city}%`).eq('zone_type','residential').limit(5)
      ])
      const zone=(zones||[]).find((z:any)=>z.zone_code.includes('RS-2')||z.zone_code.includes('R-1')||z.zone_code.includes('RS'))||(zones||[])[0]
      const hist=prop?await getHistory(prop.FOLIO_NUMBER,city):[]
      const addr=gm?.results?.[0]?.formatted_address||null
      return new Response(JSON.stringify({
        success:true,location:{lat,lng,city,google_address:addr},
        property:prop?{folio_number:prop.FOLIO_NUMBER,full_address:prop.full_address,city_name:city,
          zip_code:prop.SITUS_ZIP_CODE,use_type:prop.use_type_label,year_built:Number(prop.BLDG_YEAR_BUILT)||null,
          beds:prop.BEDS,baths:prop.BATHS,total_sqft:Number(prop.BLDG_TOT_SQ_FOOTAGE)||null,
          match_method:method,permit_history_count:hist.length,permit_history:hist}:null,
        property_found:!!prop,city:cd,zone,
        setbacks:zone?{front_ft:zone.front_setback_ft,rear_ft:zone.rear_setback_ft,side_ft:zone.side_setback_ft,
          max_height_ft:zone.max_height_ft,pool_rear_ft:zone.pool_rear_setback_ft,fence_max_height_ft:zone.fence_max_height_rear_ft}:null
      }),{headers:{...CORS,'Content-Type':'application/json'}})
    }

    // ── checkPermit ──────────────────────────────────────────────────────────
    if(action==='checkPermit'){
      if(!image_base64||image_base64.length<100)
        return new Response(JSON.stringify({success:false,error:'No image. Try again.'}),{status:400,headers:{...CORS,'Content-Type':'application/json'}})

      let prop:any=null,gm:any=null,method='none'
      if(lat&&lng){const r=await findProp(lat,lng);prop=r.prop;gm=r.gm;method=r.method}

      const city=resolveCity(prop,gm)||(city_name||'Broward County')
      const{data:cd}=await sb.from('cities').select('name,building_department_phone')
        .ilike('name',`%${city}%`).limit(1).single()

      // Only fetch permit_id, permit_name, category, fees — skip description to save tokens
      let permits:any[]=[]
      if(cd?.name){
        const{data:p}=await sb.from('fee_rules')
          .select('permit_id,permit_name,category,base_fee,rate_percentage')
          .eq('city_name',cd.name).order('sort_order')
        permits=p||[]
      }

      const hist=prop?await getHistory(prop.FOLIO_NUMBER,city):[]
      const addr=gm?.results?.[0]?.formatted_address||null

      // Compact permit list — just the essentials
      const permitCtx=permits.map((p:any)=>`${p.permit_id}|${p.permit_name}|${p.category}|$${p.base_fee}+${p.rate_percentage}%`).join('\n')

      // Compact property context
      const propCtx=prop
        ?`${prop.full_address}|Folio:${prop.FOLIO_NUMBER}|${prop.use_type_label}|Built:${Number(prop.BLDG_YEAR_BUILT)||'?'}|${Number(prop.BLDG_TOT_SQ_FOOTAGE)||'?'}sqft${hist.length?`|Permits:${hist.map((h:any)=>h.permit_type).join(',')}`:'|NoHistory'}`
        :`No BCPA match. City:${city}`

      // Context for the model. Structured output is enforced via the tool schema below.
      const sys=`Broward County FL building inspector. HVHZ=170mph. City:${cd?.name||city}
Property:${propCtx}
Permits(id|name|cat|fee):
${permitCtx||'Use Broward general knowledge.'}
Analyze the photo and call record_analysis with every visible structure/feature that may need a permit. Set permit_id to the matching id above when one applies. Keep all text fields brief.`

      let analysis:any
      try{
        if(!claudeKey) throw new Error('ANTHROPIC_API_KEY missing')
        const res=await fetch('https://api.anthropic.com/v1/messages',{
          method:'POST',
          headers:{'x-api-key':claudeKey,'anthropic-version':'2023-06-01','content-type':'application/json'},
          body:JSON.stringify({
            model:'claude-sonnet-4-6',
            max_tokens:1500,
            system:sys,
            tools:[{name:'record_analysis',description:'Record the permit analysis of the photo.',input_schema:ANALYSIS_SCHEMA}],
            tool_choice:{type:'tool',name:'record_analysis'},
            messages:[{role:'user',content:[
              {type:'image',source:{type:'base64',media_type:'image/jpeg',data:image_base64}},
              {type:'text',text:`Photo from ${addr||prop?.full_address||city}.`}
            ]}]
          })
        })
        const d=await res.json()
        console.log('Claude:',res.status,d.error?.message||'ok','usage:',JSON.stringify(d.usage||{}))
        if(d.error) throw new Error(d.error.message)
        const tool=(d.content||[]).find((b:any)=>b.type==='tool_use')
        if(!tool?.input) throw new Error('No structured analysis returned')
        analysis=tool.input
      }catch(e:any){
        console.error('Claude fail:',e.message)
        analysis={what_i_see:'AI unavailable.',structures:[],no_permit_needed:[],red_flags:[],
          next_steps:`Call ${cd?.name||city} Building Dept${cd?.building_department_phone?` ${cd.building_department_phone}`:''}`,
          ai_error:e.message}
      }

      // Enrich with full DB permit data for display
      const enriched=(analysis.structures||[]).map((s:any)=>{
        const db=permits.find((p:any)=>p.permit_id===s.permit_id)
        return{...s,permit_name:db?.permit_name||s.permit_name,base_fee:db?.base_fee??s.base_fee,
          rate_percentage:db?.rate_percentage??s.rate_percentage,from_database:!!db}
      })

      return new Response(JSON.stringify({
        success:true,
        property:prop?{folio_number:prop.FOLIO_NUMBER,full_address:prop.full_address,
          google_address:addr,city_name:cd?.name||city,zip_code:prop.SITUS_ZIP_CODE,
          use_type:prop.use_type_label,year_built:Number(prop.BLDG_YEAR_BUILT)||null,
          beds:prop.BEDS,baths:prop.BATHS,total_sqft:Number(prop.BLDG_TOT_SQ_FOOTAGE)||null,match_method:method}:null,
        property_found:!!prop,google_address:addr,permit_history:hist,
        city:cd?.name||city,city_phone:cd?.building_department_phone,
        total_permits_in_database:permits.length,
        analysis:{...analysis,structures:enriched}
      }),{headers:{...CORS,'Content-Type':'application/json'}})
    }

    return new Response(JSON.stringify({success:false,error:`Unknown: ${action}`}),{status:400,headers:{...CORS,'Content-Type':'application/json'}})

  }catch(err:any){
    console.error('Error:',err.message)
    return new Response(JSON.stringify({success:false,error:err.message}),{status:400,headers:{...CORS,'Content-Type':'application/json'}})
  }
})
