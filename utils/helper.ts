import { FinalPost } from "../components/editor";
import { PostDetail } from "./types";

export const generateFormData = (post: FinalPost) => {
  const formData = new FormData();
  for (let key in post) {
    const value = (post as any)[key];
    
    // Bỏ qua các giá trị undefined hoặc null
    if (value === undefined || value === null) continue;
    
    if (key === "tags") {
      if (typeof value === "string" && value.trim()) {
        const tags = value.split(",").map((tag: string) => tag.trim());
        formData.append("tags", JSON.stringify(tags));
      }
    } else if (key === "meta") {
      let metaVal = typeof value === "string" ? value.trim() : "";
      if (!metaVal && post.content) {
        metaVal = post.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().substring(0, 160);
      }
      formData.append("meta", metaVal || post.title || "Bài viết Q8Design");
    } else if (key === "thumbnail") {
      // Xử lý thumbnail: có thể là File hoặc string (URL từ R2/gallery)
      if (value instanceof File) {
        formData.append("thumbnail", value);
      } else if (typeof value === "string" && value.trim()) {
        formData.append("thumbnail", value.trim());
        formData.append("thumbnailUrl", value.trim());
      }
    } else if (key === "isFeatured") {
      formData.append("isFeatured", value ? "true" : "false");
    } else if (key === "isDirectPost") {
      formData.append("isDirectPost", value ? "true" : "false");
    } else if (key === "category") {
      // Đảm bảo category luôn được gửi lên (trim để đảm bảo format đúng)
      // Nếu category là empty string hoặc undefined, vẫn gửi lên để API có thể xử lý
      if (typeof value === "string") {
        const trimmedCategory = value.trim();
        // Luôn append category, kể cả khi rỗng (API sẽ giữ nguyên giá trị cũ nếu rỗng)
        formData.append("category", trimmedCategory);
      } else if (value !== undefined && value !== null) {
        formData.append("category", String(value));
      }
      // Nếu value là undefined hoặc null, không append (đã được xử lý ở trên)
    } else if (key === "faqs") {
      formData.append("faqs", JSON.stringify(value || []));
    } else {
      // Các field khác
      formData.append(key, value);
    }
  }

  return formData;
};

export const filterPosts = (posts: PostDetail[], postToFilter: PostDetail) => {
  return posts.filter((post) => {
    return post.id !== postToFilter.id;
  });
};

export const trimText = (text: string, trimBy: number) => {
  if (text.length <= trimBy) return text;
  return text.substring(0, trimBy).trim() + "...";
};
