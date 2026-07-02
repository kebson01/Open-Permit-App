import LegalPage, { Section } from "@/components/legal/LegalPage";

const SUPPORT_EMAIL = "support@open-permit.com";

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="July 2, 2026">
      <p>
        These Terms of Service ("Terms") govern your use of the OpenPermit application and website
        (the "Service"). By using the Service, you agree to these Terms.
      </p>

      <Section heading="The Service">
        <p>OpenPermit helps homeowners and contractors understand building-permit requirements,
          estimate fees, and find licensed professionals in supported municipalities.</p>
      </Section>

      <Section heading="Not Legal or Professional Advice">
        <p>
          The permit information, fee estimates, and AI-generated results provided by the Service are
          for general informational purposes only and may be incomplete or out of date. They are{" "}
          <strong>not</strong> a substitute for guidance from your local building department or a
          licensed professional. Always confirm requirements with the applicable city or county
          before starting work or submitting an application.
        </p>
      </Section>

      <Section heading="Accounts">
        <p>You are responsible for the accuracy of information you provide and for maintaining the
          security of your account credentials.</p>
      </Section>

      <Section heading="Acceptable Use">
        <p>You agree not to misuse the Service, including by attempting to disrupt it, access it
          without authorization, or use it for any unlawful purpose.</p>
      </Section>

      <Section heading="Camera & Location Features">
        <p>Features such as the Live Camera scan require camera and location permissions. You are
          responsible for using these features lawfully and only where you have the right to do so.</p>
      </Section>

      <Section heading="Payments">
        <p>If the Service offers paid features, payments are processed by Stripe and are subject to
          the terms presented at the time of purchase.</p>
      </Section>

      <Section heading="Disclaimers">
        <p>The Service is provided "as is" and "as available" without warranties of any kind, whether
          express or implied, including accuracy, fitness for a particular purpose, and
          non-infringement.</p>
      </Section>

      <Section heading="Limitation of Liability">
        <p>To the fullest extent permitted by law, OpenPermit will not be liable for any indirect,
          incidental, or consequential damages, or for any decisions made in reliance on information
          provided by the Service.</p>
      </Section>

      <Section heading="Governing Law">
        <p>These Terms are governed by the laws of the State of Florida, without regard to its
          conflict-of-laws rules.</p>
      </Section>

      <Section heading="Changes to These Terms">
        <p>We may update these Terms from time to time. Continued use of the Service after changes
          take effect constitutes acceptance of the revised Terms.</p>
      </Section>

      <Section heading="Contact Us">
        <p>Questions about these Terms? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-[#003466]">{SUPPORT_EMAIL}</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
