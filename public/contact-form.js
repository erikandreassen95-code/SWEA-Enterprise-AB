(() => {
  const successMessage =
    "Det här är en lokal demo. Inget har skickats och inga personuppgifter har sparats.";

  function initializeContactForm() {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");
    if (!(form instanceof HTMLFormElement) || !status) return;

    const fields = Object.fromEntries(
      ["name", "email", "company", "phone", "location", "service", "description", "website"].map(
        (fieldName) => [fieldName, form.elements.namedItem(fieldName)]
      )
    );
    const submitButton = form.querySelector(
      'button[data-demo-submit], button[type="submit"], button[type="button"][disabled]'
    );
    if (
      !(fields.name instanceof HTMLInputElement) ||
      !(fields.email instanceof HTMLInputElement) ||
      !(fields.description instanceof HTMLTextAreaElement) ||
      !(fields.service instanceof HTMLSelectElement) ||
      !(submitButton instanceof HTMLButtonElement)
    ) {
      return;
    }

    form.noValidate = false;
    fields.name.required = true;
    fields.name.maxLength = 100;
    fields.email.required = true;
    fields.email.type = "email";
    fields.email.maxLength = 254;
    fields.description.required = true;
    fields.description.maxLength = 2000;
    fields.service.required = true;
    const requestedService = new URLSearchParams(window.location.search).get("tjanst");
    if (requestedService && [...fields.service.options].some((option) => option.value === requestedService)) {
      fields.service.value = requestedService;
    }

    for (const [fieldName, maximum] of [
      ["company", 120],
      ["phone", 40],
      ["location", 120],
    ]) {
      const field = fields[fieldName];
      if (field instanceof HTMLInputElement) field.maxLength = maximum;
    }

    for (const field of [fields.name, fields.description]) {
      field.addEventListener("input", () => field.setCustomValidity(""));
    }

    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const originalButtonLabel = submitButton.textContent;
    let submissionLocked = false;

    function showConfirmation() {
      form.reset();
      submitButton.textContent = "Demo klar";
      status.hidden = false;
      status.textContent = successMessage;
      const retryButton = document.createElement("button");
      retryButton.type = "button";
      retryButton.className = "button";
      retryButton.textContent = "Prova igen";
      retryButton.addEventListener("click", () => {
        submissionLocked = false;
        submitButton.disabled = false;
        submitButton.textContent = originalButtonLabel;
        status.textContent = "";
        status.hidden = true;
        fields.name.focus();
      });
      status.append(document.createElement("br"), retryButton);
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (submissionLocked) return;

      // Spam traps receive only the same local confirmation as any demo entry.
      if (fields.website && fields.website.value) {
        submissionLocked = true;
        submitButton.disabled = true;
        showConfirmation();
        return;
      }

      for (const field of [fields.name, fields.description]) {
        if (!field.value.trim()) {
          field.setCustomValidity("Fyll i det här fältet.");
          field.reportValidity();
          return;
        }
      }
      if (!form.reportValidity()) return;

      // No request or storage is used. The delay exposes the disabled state.
      submissionLocked = true;
      submitButton.disabled = true;
      submitButton.textContent = "Kontrollerar …";
      status.hidden = false;
      status.textContent = "Kontrollerar formuläret …";
      window.setTimeout(showConfirmation, 450);
    });

    // The static markup keeps this button inert until the local handler exists.
    submitButton.type = "submit";
    submitButton.disabled = false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeContactForm, { once: true });
  } else {
    initializeContactForm();
  }
})();
