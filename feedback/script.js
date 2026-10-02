/**
 * Avantis PC Assist - Feedback Page Client Script
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("feedbackForm");
  const feedbackText = document.getElementById("feedbackText");
  const submitBtn = document.getElementById("submitBtn");
  const btnSpinner = document.getElementById("btnSpinner");
  const btnText = document.getElementById("btnText");
  const alertBanner = document.getElementById("alertBanner");
  const alertMessage = document.getElementById("alertMessage");
  const successContent = document.getElementById("successContent");
  const resetBtn = document.getElementById("resetBtn");

  // Handle Input State and Activation
  const updateInputState = () => {
    if (!feedbackText || !submitBtn) return;
    const trimmed = feedbackText.value.trim();
    if (trimmed.length >= 3) {
      submitBtn.removeAttribute("disabled");
      submitBtn.classList.add("ready");
    } else {
      submitBtn.setAttribute("disabled", "true");
      submitBtn.classList.remove("ready");
    }
  };

  if (feedbackText) {
    feedbackText.addEventListener("input", updateInputState);
  }

  // Helper to show alert banner
  const showAlert = (message) => {
    if (!alertBanner || !alertMessage) return;
    alertMessage.textContent = message;
    alertBanner.style.display = "flex";
  };

  const hideAlert = () => {
    if (alertBanner) alertBanner.style.display = "none";
  };

  // Helper to toggle button loading state
  const setLoading = (isLoading) => {
    if (!submitBtn || !btnSpinner || !btnText) return;
    if (isLoading) {
      submitBtn.setAttribute("disabled", "true");
      submitBtn.classList.remove("ready");
      btnSpinner.style.display = "inline-block";
      btnText.textContent = "Sending feedback...";
    } else {
      btnSpinner.style.display = "none";
      btnText.textContent = "Send feedback";
      updateInputState();
    }
  };

  // Handle Form Submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      const message = feedbackText ? feedbackText.value.trim() : "";

      if (message.length < 3) {
        showAlert("Please describe what is happening before sending feedback.");
        if (feedbackText) feedbackText.focus();
        return;
      }

      setLoading(true);

      try {
        const formData = new FormData(form);
        formData.append("screen_resolution", `${window.screen.width}x${window.screen.height}`);
        formData.append("user_timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown");
        formData.append("submitted_at", new Date().toISOString());

        const response = await fetch(form.action, {
          method: "POST",
          body: formData,
          headers: {
            "Accept": "application/json"
          }
        });

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            data = { success: response.ok, message: text || "Feedback processed." };
          }
        }

        if (data && data.success) {
          form.style.display = "none";
          if (successContent) successContent.style.display = "block";
        } else {
          const errorMsg = (data && data.message) ? data.message : "Could not send feedback. Please try again.";
          showAlert(errorMsg);
        }
      } catch (err) {
        console.error("Submission failed:", err);
        showAlert("Network error or server unreachable. Please try again.");
      } finally {
        setLoading(false);
      }
    });
  }

  // Handle Reset / Submit Another
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (form) form.reset();
      updateInputState();
      hideAlert();
      if (successContent) successContent.style.display = "none";
      if (form) form.style.display = "block";
      if (feedbackText) feedbackText.focus();
    });
  }

  updateInputState();
});
