/* eslint-disable @next/next/no-img-element */
"use client";

import { useActionState, useEffect, useState } from "react";
import { addPhotoAction, type PhotoFormState } from "@/app/actions/foundation";

export function PhotoUploadForm({ resourceId, resourceName }: { resourceId: string; resourceName: string }) {
  const [state, action, pending] = useActionState<PhotoFormState, FormData>(addPhotoAction, undefined);
  const [urlPreview, setUrlPreview] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
  }, [filePreview]);

  const preview = filePreview || urlPreview.trim();

  return (
    <form action={action} className="mt-5 grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="resourceId" value={resourceId} />
      <label className="field"><span>Image file</span><input name="file" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; setFilePreview(file ? URL.createObjectURL(file) : null); setPreviewFailed(false); }} /></label>
      <label className="field"><span>Or image URL</span><input name="url" type="url" placeholder="https://example.com/room.jpg" value={urlPreview} onChange={(event) => { setUrlPreview(event.target.value); setPreviewFailed(false); }} /></label>
      <label className="field"><span>Alt text</span><input name="alt" placeholder={resourceName} /></label>
      <div className="flex items-end"><button className="button button-primary" disabled={pending} type="submit">{pending ? "Adding…" : "Add photo"}</button></div>
      {preview && <div className="overflow-hidden rounded-2xl border border-[#dfe4df] bg-[#f4f6f3] sm:col-span-2">{previewFailed ? <p className="px-5 py-10 text-center text-sm text-red-700">This image cannot be previewed. Check that the URL points directly to a public image.</p> : <img src={preview} alt="New workspace photo preview" className="max-h-72 w-full object-cover" onError={() => setPreviewFailed(true)} />}<p className="border-t border-[#dfe4df] px-4 py-2 text-xs text-[#68736e]">Image preview</p></div>}
      {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2" role="alert" aria-live="assertive">{state.error}</p>}
      {state?.success && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:col-span-2" role="status" aria-live="polite">{state.success}</p>}
    </form>
  );
}
