import { FormButton } from "@/components/form-button";

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

export function WorkspaceForm({ action, locations, floors, categories, amenities, resource }: { action: (formData: FormData) => void | Promise<void>; locations: Choice[]; floors: FloorChoice[]; categories: Choice[]; amenities: Choice[]; resource?: ResourceValues }) {
  return <form action={action} className="panel grid gap-6 p-6 sm:grid-cols-2 sm:p-8">{resource && <input type="hidden" name="id" value={resource.id} />}<label className="field sm:col-span-2"><span>Workspace name</span><input name="name" required defaultValue={resource?.name} placeholder="Meeting Room A" /></label><label className="field"><span>Location</span><select name="locationId" required defaultValue={resource?.locationId ?? ""}><option value="" disabled>Select location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label><label className="field"><span>Floor or zone (optional)</span><select name="floorId" defaultValue={resource?.floorId ?? ""}><option value="">No floor</option>{floors.map((floor) => <option key={floor.id} value={floor.id}>{floor.locationName} · {floor.name}</option>)}</select></label><label className="field"><span>Category</span><select name="categoryId" defaultValue={resource?.categoryId ?? ""}><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="field"><span>Capacity</span><input name="capacity" type="number" min={1} defaultValue={resource?.capacity ?? 1} required /></label><label className="field sm:col-span-2"><span>Description</span><textarea name="description" rows={4} defaultValue={resource?.description ?? ""} placeholder="A quiet, naturally lit meeting room…" /></label><label className="field"><span>Pricing type</span><select name="pricingType" defaultValue={resource?.pricingType ?? "HOURLY"}><option value="HOURLY">Hourly</option><option value="DAILY">Daily</option><option value="MONTHLY">Monthly</option><option value="FIXED">Fixed</option><option value="FREE">Free</option></select></label><div className="grid grid-cols-[1fr_110px] gap-3"><label className="field"><span>Price</span><input name="price" type="number" min={0} step="0.01" defaultValue={resource?.price ?? "0"} /></label><label className="field"><span>Currency</span><select name="currency" defaultValue={resource?.currency ?? "PKR"}><option>PKR</option><option>USD</option><option>AED</option><option>GBP</option><option>EUR</option></select></label></div>{!resource && <label className="flex items-center gap-3 rounded-xl border border-[#dbe1dc] px-4 py-3 text-sm font-medium sm:col-span-2"><input className="size-4" type="checkbox" name="isPublic" defaultChecked />Visible publicly</label>}<fieldset className="sm:col-span-2"><legend className="mb-3 text-sm font-semibold">Amenities</legend>{amenities.length ? <div className="flex flex-wrap gap-2">{amenities.map((amenity) => <label key={amenity.id} className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-[#f4f6f3] px-3 py-2 text-sm"><input className="size-4" type="checkbox" name="amenityIds" value={amenity.id} defaultChecked={resource?.amenityIds.includes(amenity.id)} />{amenity.name}</label>)}</div> : <p className="text-sm text-[#7c857f]">No amenities have been created yet.</p>}</fieldset><div className="sm:col-span-2"><FormButton>{resource ? "Save workspace" : "Create workspace"}</FormButton></div></form>;
}
