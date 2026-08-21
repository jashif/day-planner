import { useState, type FormEvent } from "react";
import { useAuth } from "../firebase/AuthProvider";

type Mode = "signin" | "signup";

const friendlyError = (error: unknown): string => {
  const code = (error as { code?: string })?.code ?? "";
  if (
    code.includes("invalid-credential") ||
    code.includes("wrong-password") ||
    code.includes("user-not-found")
  ) {
    return "Incorrect email or password.";
  }
  if (code.includes("email-already-in-use")) return "An account with that email already exists.";
  if (code.includes("weak-password")) return "Password should be at least 6 characters.";
  if (code.includes("invalid-email")) return "Enter a valid email address.";
  return "Something went wrong. Please try again.";
};

export const AuthScreen = () => {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="composer auth-card">
        <p className="eyebrow">day planner</p>
        <h1 className="date-heading">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="sub">Sign in to sync your tasks across devices.</p>

        <form className="task-form auth-form" onSubmit={handleSubmit}>
          <input
            className="field auth-field"
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="field auth-field"
            type="password"
            placeholder="Password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="add-btn auth-submit" type="submit" disabled={isSubmitting}>
            {mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          className="field auth-google"
          type="button"
          onClick={handleGoogle}
          disabled={isSubmitting}
        >
          Continue with Google
        </button>

        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setError(null);
            setMode(mode === "signin" ? "signup" : "signin");
          }}
        >
          {mode === "signin"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
};
