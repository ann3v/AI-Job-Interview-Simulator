const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginValues = {
  email: string;
  password: string;
};

export type SignupValues = LoginValues & {
  fullName: string;
};

export type AuthFieldErrors = Partial<Record<keyof SignupValues, string>>;

function validateEmail(email: string) {
  return EMAIL_PATTERN.test(email);
}

export function validateLoginValues(values: LoginValues) {
  const errors: AuthFieldErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!validateEmail(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  return errors;
}

export function validateSignupValues(values: SignupValues) {
  const errors = validateLoginValues(values);

  if (!values.fullName.trim()) {
    errors.fullName = "Full name is required.";
  }

  return errors;
}

export function hasAuthErrors(errors: AuthFieldErrors) {
  return Object.keys(errors).length > 0;
}

export function getSafeRedirectPath(pathname: string | null) {
  if (!pathname || !pathname.startsWith("/") || pathname.startsWith("//")) {
    return "/dashboard";
  }

  return pathname;
}
