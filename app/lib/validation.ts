export type AuthFormState = {
  message: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    password?: string;
  };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateRegisterInput(formData: FormData) {
  const name = getString(formData, "name");
  const email = normalizeEmail(getString(formData, "email"));
  const password = getString(formData, "password");
  const fieldErrors: AuthFormState["fieldErrors"] = {};

  if (name.length < 2 || name.length > 80) {
    fieldErrors.name = "Name must be between 2 and 80 characters.";
  }

  if (!emailPattern.test(email) || email.length > 254) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (password.length < 8 || password.length > 128) {
    fieldErrors.password = "Password must be between 8 and 128 characters.";
  }

  return {
    data: { name, email, password },
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
}

export function validateLoginInput(formData: FormData) {
  const email = normalizeEmail(getString(formData, "email"));
  const password = getString(formData, "password");
  const fieldErrors: AuthFormState["fieldErrors"] = {};

  if (!emailPattern.test(email) || email.length > 254) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!password) {
    fieldErrors.password = "Enter your password.";
  }

  return {
    data: { email, password },
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
}
