"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Camera, Check, Trash2, X } from "lucide-react";

import { UserAvatar } from "@/components/shell/user-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { User } from "@/lib/api-types";
import {
  removeAvatarAction,
  setAvatarAction,
  signAvatarUploadAction,
  updateNameAction,
  type AvatarMime,
} from "@/lib/profile/actions";

const PHOTO_TYPES: AvatarMime[] = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

type Status = { kind: "saved"; message: string } | { kind: "error"; message: string } | null;

export function ProfileForm({
  user,
  provider,
  memberSince,
}: {
  user: User;
  provider: string;
  memberSince: string;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="text-micro font-semibold uppercase tracking-wider text-foreground-subtle">Profile</p>
        <h1 className="mt-1 font-display text-display-md font-medium tracking-tight">Your profile</h1>
      </header>
      <PhotoCard user={user} />
      <NameCard user={user} />
      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="text-h3 font-semibold text-foreground">Account</h2>
          <dl className="grid grid-cols-1 gap-4 text-body-sm sm:grid-cols-3">
            <div>
              <dt className="text-caption text-foreground-subtle">Email</dt>
              <dd className="mt-0.5 break-all text-foreground">{user.email}</dd>
            </div>
            <div>
              <dt className="text-caption text-foreground-subtle">Signed in with</dt>
              <dd className="mt-0.5 text-foreground">{provider}</dd>
            </div>
            <div>
              <dt className="text-caption text-foreground-subtle">Member since</dt>
              <dd className="mt-0.5 text-foreground">{memberSince}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function PhotoCard({ user }: { user: User }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState<{ file: File; preview: string } | null>(null);
  const [status, setStatus] = useState<Status>(null);

  // Free the preview's object URL when it's replaced or the page unloads.
  useEffect(() => () => {
    if (picked) URL.revokeObjectURL(picked.preview);
  }, [picked]);

  const current = user.photo_url ?? user.avatar_url;
  const shown = picked?.preview ?? current;
  const source = user.photo_url ? "uploaded" : user.avatar_url ? "google" : "initials";

  function onPick(files: FileList | null) {
    const file = files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type as AvatarMime)) {
      setStatus({ kind: "error", message: "Choose a JPG, PNG or WebP image." });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setStatus({
        kind: "error",
        message: `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 2 MB.`,
      });
      return;
    }
    setStatus(null);
    setPicked({ file, preview: URL.createObjectURL(file) });
  }

  function onSave() {
    if (!picked) return;
    const { file } = picked;
    startTransition(async () => {
      const sig = await signAvatarUploadAction(file.type as AvatarMime, file.size);
      if (!sig.ok) return setStatus({ kind: "error", message: sig.error });
      const put = await fetch(sig.data.upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        return setStatus({ kind: "error", message: `Upload failed (${put.status}). Please try again.` });
      }
      const set = await setAvatarAction(sig.data.storage_path);
      if (!set.ok) return setStatus({ kind: "error", message: set.error });
      setPicked(null);
      setStatus({ kind: "saved", message: "Photo updated" });
      router.refresh();
    });
  }

  function onRemove() {
    if (!confirm("Remove your profile photo?")) return;
    startTransition(async () => {
      const res = await removeAvatarAction();
      if (!res.ok) return setStatus({ kind: "error", message: res.error });
      setStatus({ kind: "saved", message: "Photo removed" });
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <UserAvatar
          user={{ name: user.display_name, email: user.email, avatarUrl: shown ?? null }}
          className="h-24 w-24 text-h2"
        />
        <div className="flex-1 space-y-3">
          <div>
            <h2 className="text-h3 font-semibold text-foreground">Profile photo</h2>
            <p className="mt-1 text-caption text-foreground-subtle">
              {picked
                ? "Preview — save to use this photo."
                : source === "uploaded"
                  ? "Your uploaded photo."
                  : source === "google"
                    ? "From your Google account. Upload one to replace it here."
                    : "Your initials are shown until you add a photo."}{" "}
              JPG, PNG or WebP, up to 2 MB.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={PHOTO_TYPES.join(",")}
            className="hidden"
            aria-label="Choose a profile photo"
            onChange={(e) => onPick(e.target.files)}
          />
          <div className="flex flex-wrap gap-2">
            {picked ? (
              <>
                <Button type="button" variant="accent" size="sm" onClick={onSave} disabled={pending}>
                  <Check />
                  {pending ? "Saving…" : "Save photo"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setPicked(null)} disabled={pending}>
                  <X />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={pending}
                >
                  <Camera />
                  {source === "uploaded" ? "Change photo" : "Upload photo"}
                </Button>
                {source === "uploaded" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    disabled={pending}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 />
                    Remove
                  </Button>
                ) : null}
              </>
            )}
          </div>
          <StatusLine status={status} />
        </div>
      </CardContent>
    </Card>
  );
}

function NameCard({ user }: { user: User }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(user.display_name ?? "");
  const [status, setStatus] = useState<Status>(null);
  const changed = name.trim() !== (user.display_name ?? "");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    startTransition(async () => {
      const res = await updateNameAction(name);
      if (!res.ok) return setStatus({ kind: "error", message: res.error });
      setStatus({ kind: "saved", message: "Saved" });
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Name</Label>
            <Input
              id="display_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              autoComplete="name"
              placeholder="Your name"
            />
            <p className="text-caption text-foreground-subtle">
              Used in your greeting and account menu. Your login name stays with your account.
            </p>
          </div>
          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="sm:mr-auto">
              <StatusLine status={status} />
            </div>
            <Button type="submit" variant="accent" disabled={pending || !changed}>
              {pending ? "Saving…" : "Save name"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return status.kind === "saved" ? (
    <p className="flex items-center gap-1.5 text-caption text-success" role="status">
      <Check className="h-4 w-4" />
      {status.message}
    </p>
  ) : (
    <p className="text-caption text-destructive" role="alert">
      {status.message}
    </p>
  );
}
