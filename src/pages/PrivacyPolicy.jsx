import LegalPage, { Section } from "@/components/legal/LegalPage";

const SUPPORT_EMAIL = "support@open-permit.com";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="July 2, 2026">
      <p>
        This Privacy Policy explains how OpenPermit ("we", "us") collects, uses, and shares
        information when you use the OpenPermit application and website (the "Service").
      </p>

      <Section heading="Information We Collect">
        <p>
          <strong>Account information.</strong> When you create an account we collect your email
          address and any profile details you provide (such as your role or company name).
        </p>
        <p>
          <strong>Location data.</strong> With your permission, the Service uses your device's GPS
          location to determine the applicable city and permit rules for features like the Live
          Camera scan. You can disable location access in your device settings.
        </p>
        <p>
          <strong>Camera images.</strong> When you use the Live Camera scan, the photo you capture is
          sent to our servers and to our AI provider solely to identify the item and return permit
          information. We do not use these images to identify individuals.
        </p>
        <p>
          <strong>Usage data.</strong> We collect standard technical data such as device type,
          browser, and interactions with the Service to operate and improve it.
        </p>
      </Section>

      <Section heading="How We Use Information">
        <p>We use the information above to provide, maintain, secure, and improve the Service,
          respond to your requests, and comply with legal obligations.</p>
      </Section>

      <Section heading="Third-Party Services">
        <p>
          We rely on trusted providers to run the Service, and information may be processed by them:
          Supabase (database, authentication, and hosting of backend functions), Anthropic (AI image
          and text analysis), Google Maps (geocoding), and Stripe (payment processing, if you make a
          payment). Each provider processes data under its own terms and privacy policy.
        </p>
      </Section>

      <Section heading="Data Retention">
        <p>We retain information for as long as your account is active or as needed to provide the
          Service and meet legal requirements. You may request deletion of your account data as
          described below.</p>
      </Section>

      <Section heading="Your Choices & Rights">
        <p>You may access, update, or request deletion of your personal information, and you may
          disable camera or location permissions at any time through your device or browser
          settings. To make a request, contact us at {SUPPORT_EMAIL}.</p>
      </Section>

      <Section heading="Children's Privacy">
        <p>The Service is not directed to children under 13, and we do not knowingly collect
          personal information from them.</p>
      </Section>

      <Section heading="Changes to This Policy">
        <p>We may update this Policy from time to time. Material changes will be reflected by the
          "Last updated" date above.</p>
      </Section>

      <Section heading="Contact Us">
        <p>Questions about this Policy? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[#003466]">{SUPPORT_EMAIL}</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
