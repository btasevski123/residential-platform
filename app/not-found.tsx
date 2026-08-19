import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-serif text-2xl tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        This page does not exist, or you do not have access to it.
      </p>
      <div className="mt-6 flex justify-center">
        <ButtonLink href="/">Go home</ButtonLink>
      </div>
    </div>
  );
}
