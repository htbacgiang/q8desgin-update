import axios from "axios";
import { GetServerSideProps, NextPage } from "next";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import AdminLayout from "../../../components/layout/AdminLayout";
import db from "../../../utils/db";
import Author from "../../../models/Author";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";

interface AuthorItem {
  id: string;
  name: string;
  slug: string;
  role: string;
  bio: string;
  avatar: string;
  socialLinks: { facebook: string; zalo: string; linkedin: string };
}

interface FormState {
  name: string;
  slug: string;
  role: string;
  bio: string;
  avatar: string;
  socialLinks: { facebook: string; zalo: string; linkedin: string };
}

const emptyForm: FormState = {
  name: "",
  slug: "",
  role: "",
  bio: "",
  avatar: "",
  socialLinks: { facebook: "", zalo: "", linkedin: "" },
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

interface Props {
  initialAuthors: AuthorItem[];
}

const AuthorsDashboard: NextPage<Props> = ({ initialAuthors }) => {
  const [authors, setAuthors] = useState<AuthorItem[]>(initialAuthors);
  const [showModal, setShowModal] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AuthorItem | null>(null);

  // Avatar R2 upload states
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDragOver, setAvatarDragOver] = useState(false);

  // Auto-generate slug from name when creating
  useEffect(() => {
    if (!editingSlug && form.name) {
      setForm((prev) => ({ ...prev, slug: slugify(form.name) }));
    }
  }, [form.name, editingSlug]);

  const openCreate = () => {
    setEditingSlug(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (author: AuthorItem) => {
    setEditingSlug(author.slug);
    setForm({
      name: author.name,
      slug: author.slug,
      role: author.role,
      bio: author.bio,
      avatar: author.avatar,
      socialLinks: { ...author.socialLinks },
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSlug(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Tên và slug là bắt buộc");
      return;
    }
    setSubmitting(true);
    try {
      if (editingSlug) {
        const { data } = await axios.patch(`/api/authors/${editingSlug}`, form);
        setAuthors((prev) =>
          prev.map((a) =>
            a.slug === editingSlug
              ? {
                  id: data.author._id,
                  name: data.author.name,
                  slug: data.author.slug,
                  role: data.author.role || "",
                  bio: data.author.bio || "",
                  avatar: data.author.avatar || "",
                  socialLinks: {
                    facebook: data.author.socialLinks?.facebook || "",
                    zalo: data.author.socialLinks?.zalo || "",
                    linkedin: data.author.socialLinks?.linkedin || "",
                  },
                }
              : a
          )
        );
        toast.success("Cập nhật tác giả thành công!");
      } else {
        const { data } = await axios.post("/api/authors", form);
        setAuthors((prev) => [
          ...prev,
          {
            id: data.author._id,
            name: data.author.name,
            slug: data.author.slug,
            role: data.author.role || "",
            bio: data.author.bio || "",
            avatar: data.author.avatar || "",
            socialLinks: {
              facebook: data.author.socialLinks?.facebook || "",
              zalo: data.author.socialLinks?.zalo || "",
              linkedin: data.author.socialLinks?.linkedin || "",
            },
          },
        ]);
        toast.success("Tạo tác giả thành công!");
      }
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/authors/${deleteTarget.slug}`);
      setAuthors((prev) => prev.filter((a) => a.slug !== deleteTarget.slug));
      toast.success("Đã xóa tác giả!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Có lỗi xảy ra khi xóa");
    } finally {
      setDeleteTarget(null);
    }
  };

  const setSocial = (key: keyof FormState["socialLinks"], value: string) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }));
  };

  // Upload avatar to R2 thumbnail folder
  const uploadAvatarToR2 = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB!");
      return;
    }
    setAvatarUploading(true);
    try {
      const { data } = await axios.post("/api/r2/upload", {
        filename: file.name,
        contentType: file.type,
        folder: "thumbnail",
      });
      await axios.put(data.uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });
      setForm((prev) => ({ ...prev, avatar: data.publicUrl }));
      toast.success("Tải ảnh đại diện lên thành công!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Lỗi khi tải ảnh lên R2");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatarToR2(file);
    e.target.value = "";
  };

  const handleAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setAvatarDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadAvatarToR2(file);
  };

  return (
    <AdminLayout title="Quản lý tác giả">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tác giả</h1>
            <p className="text-sm text-gray-400 mt-1">
              {authors.length} tác giả
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#105d97] text-white rounded-xl text-sm font-semibold hover:bg-[#0d4d7f] transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Thêm tác giả
          </button>
        </div>

        {/* List */}
        {authors.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">👤</p>
            <p className="font-medium">Chưa có tác giả nào</p>
            <p className="text-sm mt-1">Nhấn &quot;Thêm tác giả&quot; để bắt đầu</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {authors.map((author) => (
              <div
                key={author.slug}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Avatar */}
                {author.avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={author.avatar}
                    alt={author.name}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#105d97] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl font-bold">
                      {author.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{author.name}</p>
                  {author.role && (
                    <p className="text-sm text-[#105d97]">{author.role}</p>
                  )}
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    /tac-gia/{author.slug}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={`/tac-gia/${author.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Xem trang
                  </a>
                  <button
                    onClick={() => openEdit(author)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => setDeleteTarget(author)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingSlug ? "Chỉnh sửa tác giả" : "Thêm tác giả mới"}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên tác giả <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: KTS Mạnh Cường"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#105d97]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="kts-manh-cuong"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#105d97]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  URL: /tac-gia/{form.slug || "..."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chức danh
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="VD: Kiến trúc sư, Founder & CEO"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#105d97]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiểu sử
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Mô tả ngắn về tác giả..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#105d97] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh đại diện
                </label>

                {/* Hidden file input */}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />

                {form.avatar ? (
                  /* Preview + actions */
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.avatar}
                      alt="Avatar preview"
                      className="w-16 h-16 rounded-full object-cover border border-gray-200 flex-shrink-0"
                    />
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        disabled={avatarUploading}
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-3 py-1.5 text-xs rounded-lg border border-[#105d97] text-[#105d97] hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        {avatarUploading ? "Đang tải..." : "Đổi ảnh"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, avatar: "" }))}
                        className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Drop zone */
                  <div
                    onDragOver={(e) => { e.preventDefault(); setAvatarDragOver(true); }}
                    onDragLeave={() => setAvatarDragOver(false)}
                    onDrop={handleAvatarDrop}
                    onClick={() => !avatarUploading && avatarInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-6 cursor-pointer transition-colors ${
                      avatarDragOver
                        ? "border-[#105d97] bg-blue-50"
                        : "border-gray-200 hover:border-[#105d97] hover:bg-blue-50/40"
                    } ${avatarUploading ? "pointer-events-none opacity-60" : ""}`}
                  >
                    {avatarUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-6 h-6 text-[#105d97] animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        <span className="text-xs text-gray-500">Đang tải lên...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0-3 3m3-3 3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.572 11.095H6.75z" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-500 text-center">
                          Kéo thả ảnh vào đây hoặc{" "}
                          <span className="text-[#105d97] font-medium">chọn file</span>
                        </span>
                        <span className="text-[10px] text-gray-400">PNG, JPG, WebP – tối đa 5MB</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Mạng xã hội</p>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Facebook</label>
                  <input
                    type="text"
                    value={form.socialLinks.facebook}
                    onChange={(e) => setSocial("facebook", e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#105d97]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Zalo</label>
                  <input
                    type="text"
                    value={form.socialLinks.zalo}
                    onChange={(e) => setSocial("zalo", e.target.value)}
                    placeholder="https://zalo.me/..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#105d97]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">LinkedIn</label>
                  <input
                    type="text"
                    value={form.socialLinks.linkedin}
                    onChange={(e) => setSocial("linkedin", e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#105d97]"
                  />
                </div>
              </div>

              {/* Footer buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-xl bg-[#105d97] text-white text-sm font-semibold hover:bg-[#0d4d7f] transition-colors disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : editingSlug ? "Lưu thay đổi" : "Tạo tác giả"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-xl">!</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xóa tác giả?</h3>
            <p className="text-sm text-gray-500 mb-1">
              Bạn có chắc muốn xóa{" "}
              <span className="font-semibold text-gray-700">{deleteTarget.name}</span>?
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Các bài viết của tác giả này sẽ không còn gắn với tác giả nữa.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<any> = async (context) => {
  const session: any = await getServerSession(context.req, context.res, authOptions as any);

  if (!session || !session.user) {
    return {
      redirect: {
        destination: `/dang-nhap?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  const role = (session.user as any)?.role;
  if (role !== "admin") {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  try {
    await db.connectDb();
    const authors = await Author.find().sort({ name: 1 }).lean();
    const initialAuthors: AuthorItem[] = authors.map((a: any) => ({
      id: a._id.toString(),
      name: a.name,
      slug: a.slug,
      role: a.role || "",
      bio: a.bio || "",
      avatar: a.avatar || "",
      socialLinks: {
        facebook: a.socialLinks?.facebook || "",
        zalo: a.socialLinks?.zalo || "",
        linkedin: a.socialLinks?.linkedin || "",
      },
    }));
    return { props: { initialAuthors } };
  } catch {
    return { props: { initialAuthors: [] } };
  } finally {
    await db.disconnectDb();
  }
};

export default AuthorsDashboard;
