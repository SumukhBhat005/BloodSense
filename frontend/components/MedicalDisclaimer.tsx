export function MedicalDisclaimer() {
  return (
    <div className="disclaimer-banner">
      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
      <div>
        <strong style={{ color: "#92400e" }}>Educational Tool Only</strong>
        <p style={{ margin: 0, marginTop: 2, color: "#b45309" }}>
          BloodSense helps you understand your lab reports in plain English. It does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.
        </p>
      </div>
    </div>
  );
}
