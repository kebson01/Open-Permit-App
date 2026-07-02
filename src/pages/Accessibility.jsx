import LegalPage, { Section } from "@/components/legal/LegalPage";

const SUPPORT_EMAIL = "support@open-permit.com";

export default function Accessibility() {
  return (
    <LegalPage title="Accessibility Statement" lastUpdated="July 2, 2026">
      <p>
        OpenPermit is committed to making its Service accessible to as many people as possible,
        including people with disabilities.
      </p>

      <Section heading="Our Goal">
        <p>We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA. These
          guidelines help make web content more accessible to people with a wide range of
          disabilities.</p>
      </Section>

      <Section heading="Measures We Take">
        <p>We consider accessibility in our design and development process, including keyboard
          navigation, sufficient color contrast, descriptive labels, and responsive layouts that
          work across devices.</p>
      </Section>

      <Section heading="Known Limitations">
        <p>Some features — such as the Live Camera scan — rely on device hardware (camera and GPS)
          and may have limited accessibility. We are working to provide alternatives where possible.</p>
      </Section>

      <Section heading="Feedback">
        <p>
          We welcome your feedback. If you encounter an accessibility barrier or need information in
          an alternative format, please email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[#003466]">{SUPPORT_EMAIL}</a>{" "}
          and we will do our best to help.
        </p>
      </Section>
    </LegalPage>
  );
}
