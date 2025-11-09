# Form Validation with react-hook-form and zod

## Overview

The `AuthForm` component has been refactored to use **react-hook-form** with **zod** validation for better type safety, user experience, and maintainability.

## Changes Made

### 1. Dependencies Added

```bash
pnpm add zod @hookform/resolvers
```

- **zod**: TypeScript-first schema validation library
- **@hookform/resolvers**: Connects zod schemas to react-hook-form

### 2. Validation Schemas

#### Sign In Schema
```typescript
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
```

#### Sign Up Schema
```typescript
const signUpSchema = z.object({
  username: z.string().min(1, "Username is required"),
  fullName: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
});
```

### 3. Form Handling

**Before (Manual):**
```typescript
const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const email = formData.get("signin-email") as string;
  const password = formData.get("signin-password") as string;
  // ...
};
```

**After (react-hook-form):**
```typescript
const signInForm = useForm<SignInFormData>({
  resolver: zodResolver(signInSchema),
  defaultValues: {
    email: "",
    password: "",
  },
});

const handleSignIn = async (data: SignInFormData) => {
  // data is already typed and validated
  await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
};
```

### 4. Form Markup Changes

**Before:**
```tsx
<Input
  id="signin-email"
  name="signin-email"
  type="email"
  required
  disabled={isLoading}
/>
```

**After:**
```tsx
<Input
  id="signin-email"
  type="email"
  disabled={signInForm.formState.isSubmitting}
  {...signInForm.register("email")}
/>
{signInForm.formState.errors.email && (
  <p className="text-sm text-destructive">
    {signInForm.formState.errors.email.message}
  </p>
)}
```

## Benefits

### 1. **Type Safety**
- Form data is fully typed with TypeScript
- No need for type assertions (`as string`)
- Autocomplete for form fields

### 2. **Better Validation**
- Declarative validation rules in schemas
- Custom error messages
- Client-side validation before submission
- Easy to extend (e.g., password strength, email format)

### 3. **Improved UX**
- Field-level error messages
- Automatic form state management
- Loading states handled by `formState.isSubmitting`
- Form reset after successful signup

### 4. **Maintainability**
- Centralized validation logic
- Easier to test
- Less boilerplate code
- Clear separation of concerns

## Usage Example

### Sign In Form
```tsx
<form onSubmit={signInForm.handleSubmit(handleSignIn)}>
  <Input {...signInForm.register("email")} />
  {signInForm.formState.errors.email && (
    <p>{signInForm.formState.errors.email.message}</p>
  )}
  <Button disabled={signInForm.formState.isSubmitting}>
    Sign In
  </Button>
</form>
```

### Adding New Validation Rules

To add password strength validation:

```typescript
const signUpSchema = z.object({
  // ... other fields
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});
```

### Custom Field Validation

For async validation (e.g., check if username exists):

```typescript
const signUpForm = useForm<SignUpFormData>({
  resolver: zodResolver(signUpSchema),
  mode: "onBlur", // Validate on blur
});

// In the schema
username: z.string()
  .min(3, "Username must be at least 3 characters")
  .refine(
    async (username) => {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();
      return !data;
    },
    "Username is already taken"
  ),
```

## Testing Checklist

- [x] Sign-in form validation (empty fields)
- [x] Sign-in form validation (invalid email)
- [x] Sign-up form validation (empty required fields)
- [x] Sign-up form validation (password too short)
- [x] Sign-up form validation (invalid email)
- [x] Form submission works correctly
- [x] Loading states display properly
- [x] Error messages from Supabase display correctly
- [x] Success flow (auto-switch to sign-in after signup)
- [x] Form reset after successful signup

## Resources

- [react-hook-form Documentation](https://react-hook-form.com/)
- [zod Documentation](https://zod.dev/)
- [@hookform/resolvers Documentation](https://github.com/react-hook-form/resolvers)
