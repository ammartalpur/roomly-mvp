/* eslint-disable @next/next/no-img-element */
"use client";

import { useActionState, useEffect, useState } from "react";
import type { WorkspaceFormState } from "@/app/actions/foundation";

type Choice = { id: string; name: string };
type FloorChoice = Choice & { locationId: string; locationName: string };
type ResourceValues = {
  id: string;
  name: string;
  description: string | null;
  locationId: string;
  floorId: string | null;
  categoryId: string | null;
  capacity: number;
  pricingType: string;
  price: string;
  currency: string;
  isPublic: boolean;
  amenityIds: string[];
};

type WorkspaceAction = (state: WorkspaceFormState, formData: FormData) => Promise<WorkspaceFormState>;

export function WorkspaceForm({ action, locations, floors, categories, amenities, resource }: { action: WorkspaceAction; locations: Choice[]; floors: FloorChoice[]; categories: Choice[]; amenities: Choice[]; resource?: ResourceValues }) {
  const [state, formAction, pending] = useActionState<WorkspaceFormState, FormData>(action, undefined);
  const [urlPreview, setUrlPreview] = useState("");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
  }, [filePreview]);

  const preview = filePreview || urlPreview.trim();

  return (
    <form action={formAction} className="panel grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
      {resource && <input type="hidden" name="id" value={resource.id} />}
      <label className="field sm:col-span-2"><span>Workspace name</span><input name="name" required defaultValue={resource?.name} placeholder="Meeting Room A" /></label>
      <label className="field"><span>Location</span><select name="locationId" required defaultValue={resource?.locationId ?? ""}><option value="" disabled>Select location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
      <label className="field"><span>Floor or zone (optional)</span><select name="floorId" defaultValue={resource?.floorId ?? ""}><option value="">No floor</option>{floors.map((floor) => <option key={floor.id} value={floor.id}>{floor.locationName} · {floor.name}</option>)}</select></label>
      <label className="field"><span>Category</span><select name="categoryId" defaultValue={resource?.categoryId ?? ""}><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="field"><span>Capacity</span><input name="capacity" type="number" min={1} defaultValue={resource?.capacity ?? 1} required /></label>
      <label className="field sm:col-span-2"><span>Description</span><textarea name="description" rows={4} defaultValue={resource?.description ?? ""} placeholder="A quiet, naturally lit meeting room…" /></label>
      <label className="field"><span>Pricing type</span><select name="pricingType" defaultValue={resource?.pricingType ?? "HOURLY"}><option value="HOURLY">Hourly</option><option value="DAILY">Daily</option><option value="MONTHLY">Monthly</option><option value="FIXED">Fixed</option><option value="FREE">Free</option></select></label>
      <div className="grid grid-cols-[1fr_110px] gap-3"><label className="field"><span>Price</span><input name="price" type="number" min={0} step="0.01" defaultValue={resource?.price ?? "0"} /></label><label className="field"><span>Currency</span><select name="currency" defaultValue={resource?.currency ?? "PKR"}><option>PKR</option><option>USD</option><option>AED</option><option>GBP</option><option>EUR</option></select></label></div>
      {!resource && <label className="flex items-center gap-3 rounded-xl border border-[#dbe1dc] px-4 py-3 text-sm font-medium sm:col-span-2"><input className="size-4" type="checkbox" name="isPublic" defaultChecked />Visible publicly</label>}
      <fieldset className="sm:col-span-2"><legend className="mb-3 text-sm font-semibold">Amenities</legend>{amenities.length ? <div className="flex flex-wrap gap-2">{amenities.map((amenity) => <label key={amenity.id} className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-[#f4f6f3] px-3 py-2 text-sm"><input className="size-4" type="checkbox" name="amenityIds" value={amenity.id} defaultChecked={resource?.amenityIds.includes(amenity.id)} />{amenity.name}</label>)}</div> : <p className="text-sm text-[#7c857f]">No amenities have been created yet.</p>}</fieldset>

      {!resource && (
        <fieldset className="grid gap-4 border-t border-[#e2e7e2] pt-6 sm:col-span-2 sm:grid-cols-2">
          <legend className="pr-3 text-sm font-semibold">Cover image <span className="font-normal text-[#7c857f]">(optional)</span></legend>
          <label className="field"><span>Upload image</span><input name="file" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; setFilePreview(file ? URL.createObjectURL(file) : null); setPreviewFailed(false); }} /></label>
          <label className="field"><span>Or paste image URL</span><input name="url" type="url" placeholder="https://example.com/room.jpg" value={urlPreview} onChange={(event) => { setUrlPreview(event.target.value); setPreviewFailed(false); }} /></label>
          <label className="field sm:col-span-2"><span>Image description</span><input name="alt" placeholder="Bright meeting room with six chairs" /></label>
          {preview && <div className="overflow-hidden rounded-2xl border border-[#dfe4df] bg-[#f4f6f3] sm:col-span-2">{previewFailed ? <p className="px-5 py-10 text-center text-sm text-red-700">This image cannot be previewed. Check that the URL points directly to a public image.</p> : <img src={preview} alt="Workspace cover preview" className="max-h-72 w-full object-cover" onError={() => setPreviewFailed(true)} />}<p className="border-t border-[#dfe4df] px-4 py-2 text-xs text-[#68736e]">Cover image preview</p></div>}
        </fieldset>
      )}

      {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2" role="alert" aria-live="assertive">{state.error}</p>}
      {state?.success && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:col-span-2" role="status" aria-live="polite">{state.success}</p>}
      <div className="sm:col-span-2"><button className="button button-primary" disabled={pending} type="submit">{pending ? (resource ? "Saving…" : "Creating…") : (resource ? "Save workspace" : "Create workspace")}</button></div>
    </form>
  );
}
