"""
trim_bcpa_columns.py
--------------------
Removes unused columns from a BCPA property export CSV/TSV file.
Only keeps the ~25 columns the app actually uses.

Usage:
    python trim_bcpa_columns.py input_file.csv output_file.csv
    python trim_bcpa_columns.py input_file.txt output_file.csv   # tab-delimited
"""

import csv
import sys
import os

# Only these columns are used by the app
KEEP_COLUMNS = {
    "FOLIO_NUMBER",
    "full_address",
    "SITUS_STREET_NUMBER",
    "SITUS_STREET_NAME",
    "SITUS_STREET_TYPE",
    "SITUS_CITY",
    "SITUS_ZIP_CODE",
    "SITUS_UNIT_NUMBER",
    "SITUS_STREET_DIRECTION",
    "NAME_LINE_1",
    "USE_CODE",
    "USE_TYPE",
    "BLDG_YEAR_BUILT",
    "BEDS",
    "BATHS",
    "BLDG_UNDER_AIR_SQ_FOOTAGE",
    "BLDG_TOT_SQ_FOOTAGE",
    "JUST_LAND_VALUE",
    "JUST_BUILDING_VALUE",
    "COUNTY_TAXABLE",
    "HOMESTEAD_FLAG",
    "EXEMPTION_TYPE",
    "SALE_DATE_1",
    "STAMP_AMOUNT_1",
    "source_city_id",
}

def detect_delimiter(filepath):
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        first_line = f.readline()
    tabs = first_line.count("\t")
    pipes = first_line.count("|")
    commas = first_line.count(",")
    if tabs >= pipes and tabs >= commas:
        return "\t"
    if pipes >= commas:
        return "|"
    return ","

def trim_file(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"ERROR: File not found: {input_path}")
        sys.exit(1)

    delimiter = detect_delimiter(input_path)
    delim_name = "TAB" if delimiter == "\t" else delimiter
    print(f"Detected delimiter: {delim_name}")

    with open(input_path, "r", encoding="utf-8", errors="replace") as infile, \
         open(output_path, "w", newline="", encoding="utf-8") as outfile:

        reader = csv.DictReader(infile, delimiter=delimiter)
        
        if not reader.fieldnames:
            print("ERROR: Could not read headers from file.")
            sys.exit(1)

        # Find which KEEP_COLUMNS actually exist in this file
        available = [col for col in reader.fieldnames if col in KEEP_COLUMNS]
        missing = KEEP_COLUMNS - set(reader.fieldnames)
        skipped = len(reader.fieldnames) - len(available)

        print(f"Total columns in file:  {len(reader.fieldnames)}")
        print(f"Columns kept:           {len(available)}")
        print(f"Columns removed:        {skipped}")
        if missing:
            print(f"Expected but not found: {', '.join(sorted(missing))}")

        writer = csv.DictWriter(outfile, fieldnames=available, extrasaction="ignore")
        writer.writeheader()

        row_count = 0
        for row in reader:
            writer.writerow({col: row[col] for col in available})
            row_count += 1
            if row_count % 50000 == 0:
                print(f"  Processed {row_count:,} rows...")

    print(f"\nDone! {row_count:,} rows written to: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python trim_bcpa_columns.py <input_file> <output_file>")
        print("Example: python trim_bcpa_columns.py bcpa_export.txt bcpa_trimmed.csv")
        sys.exit(1)

    trim_file(sys.argv[1], sys.argv[2])