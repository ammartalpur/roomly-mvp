"use client";

import { useActionState } from "react";
import { addPhotoAction, type PhotoFormState } from "@/app/actions/foundation";

export function PhotoUploadForm({ resourceId, resourceName }: { resourceId: string; resourceName: string }) {
  const [state, action, pending] = useActionState<PhotoFormState, FormData>(addPhotoAction, undefined);

  return (
    <form action={action} className="mt-5 grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="resourceId" value={resourceId} />
      <label className="field"><span>Image file</span><input name="file" type="file" accept="image/*" /></label>
      <label className="field"><span>Or image URL</span><input name="url" type="url" placeholder="https://res.cloudinary.com/..." /></label>
      <label className="field"><span>Alt text</span><input name="alt" placeholder={resourceName} /></label>
      <div className="flex items-end"><button className="button button-primary" disabled={pending} type="submit">{pending ? "Adding…" : "Add photo"}</button></div>
      {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2" role="alert" aria-live="assertive">{state.error}</p>}
      {state?.success && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:col-span-2" role="status" aria-live="polite">{state.success}</p>}
    </form>
  );
}
