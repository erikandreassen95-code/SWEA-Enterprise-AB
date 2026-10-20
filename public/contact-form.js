(() => {
  function initializeContactForm() {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");
    if (!(form instanceof HTMLFormElement) || !status) return;

    const submitButton = form.querySelector('[data-contact-submit], button[type="submit"]');
    if (!(submitButton instanceof HTMLButtonElement)) return;
    if (!form.querySelector('.cf-turnstile[data-sitekey]')) return;

    const originalButtonLabel = submitButton.textContent;
    const fields = Object.fromEntries(
      ["name", "email", "company", "phone", "location", "service", "description", "website"].map(
        (name) => [name, form.elements.namedItem(name)]
      )
    );
    const requestedService = new URLSearchParams(window.location.search).get("tjanst");
    if (requestedService && fields.service instanceof HTMLSelectElement &&
        [...fields.service.options].some((option) => option.value === requestedService)) {
      fields.service.value = requestedService;
    }

    function showStatus(message, success) {
      status.hidden = false;
      status.textContent = message;
      status.dataset.state = success ? "success" : "error";
    }

    function resetTurnstile() {
      if (window.turnstile && typeof window.turnstile.reset === "function") {
        window.turnstile.reset();
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitButton.disabled || !form.reportValidity()) return;

      const getValue = (name) => {
        const field = fields[name];
        return field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement ||
          field instanceof HTMLSelectElement ? field.value.trim() : "";
      };
      const tokenField = form.elements.namedItem("cf-turnstile-response");
      const turnstileToken = tokenField instanceof HTMLInputElement ? tokenField.value : "";
      if (!turnstileToken) {
        showStatus("Bekräfta säkerhetskontrollen och försök igen.", false);
        return;
      }

      const payload = {
        name: getValue("name"),
        email: getValue("email"),
        company: getValue("company"),
        phone: getValue("phone"),
        location: getValue("location"),
        service: getValue("service"),
        description: getValue("description"),
        website: getValue("website"),
        turnstileToken,
      };

      submitButton.disabled = true;
      submitButton.textContent = "Skickar …";
      showStatus("Skickar din förfrågan …", true);
      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          if (response.status === 400) {
            showStatus("Kontrollera uppgifterna och säkerhetskontrollen. Försök sedan igen.", false);
          } else if (response.status === 429) {
            showStatus("För många försök just nu. Vänta en stund och försök igen.", false);
          } else {
            showStatus("Det gick inte att skicka förfrågan. Försök igen senare.", false);
          }
          return;
        }
        form.reset();
        showStatus("Tack! Din förfrågan har skickats. Vi återkommer så snart vi kan.", true);
      } catch {
        showStatus("Det gick inte att skicka förfrågan. Kontrollera anslutningen och försök igen.", false);
      } finally {
        resetTurnstile();
        submitButton.disabled = false;
        submitButton.textContent = originalButtonLabel;
      }
    });

    // The static markup leaves the button inert until this handler is available.
    submitButton.type = "submit";
    submitButton.disabled = false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeContactForm, { once: true });
  } else {
    initializeContactForm();
  }
})();
