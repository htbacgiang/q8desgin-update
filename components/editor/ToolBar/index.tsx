import { FC, useState, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { AiFillCaretDown } from "react-icons/ai";
import { RiDoubleQuotesL } from "react-icons/ri";
import {
  BsTypeStrikethrough,
  BsBraces,
  BsCode,
  BsListOl,
  BsListUl,
  BsTypeBold,
  BsTypeItalic,
  BsTypeUnderline,
  BsImageFill,
  BsImages,
} from "react-icons/bs";
import {
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignLeft,
  MdAspectRatio,
  MdDeleteOutline,
} from "react-icons/md";

import Button from "./Button";
import { getFocusedEditor } from "../EditorUtils";
import DropdownOptions from "../../common/DropdownOptions";
import InsertLink from "../Link/InsertLink";
import type { linkOption } from "../Link/LinkForm";
import EmbedYoutube from "./EmbedYoutube";
import EmbedFacebookReels from "./EmbedFacebookReels";
import EmbedImage from "./EmbedImage";
import InsertTable from "./InsertTable";

interface Props {
  editor: Editor | null;
  onOpenImageClick?(): void;
  onOpenGalleryClick?(): void;
  onOpenR2ModalClick?(): void;
  onOpenR2GalleryClick?(): void;
  onDropdownToggle?(isOpen: boolean): void;
}

const ToolBar: FC<Props> = ({
  editor,
  onOpenImageClick,
  onOpenGalleryClick,
  onOpenR2ModalClick,
  onOpenR2GalleryClick,
  onDropdownToggle,
}): JSX.Element | null => {
  const [textColor, setTextColor] = useState<string>("#000000");
  const [, forceUpdate] = useState(0);

  // Trạng thái ảnh đang được chọn trong editor
  const [selectedImage, setSelectedImage] = useState<{
    src?: string;
    width?: string;
    aspectRatio?: string;
    alignment?: "left" | "center" | "right";
  } | null>(null);

  useEffect(() => {
    if (!editor) {
      setSelectedImage(null);
      return;
    }

    const syncSelectedImage = () => {
      forceUpdate((n) => n + 1);
      if (editor.isActive("image")) {
        const attrs = editor.getAttributes("image");
        setSelectedImage({
          src: attrs.src || "",
          width: attrs.width || "100%",
          aspectRatio: attrs.aspectRatio || "auto",
          alignment: (attrs.alignment as "left" | "center" | "right") || "center",
        });
      } else {
        setSelectedImage(null);
      }
    };

    editor.on("selectionUpdate", syncSelectedImage);
    editor.on("transaction", syncSelectedImage);
    syncSelectedImage();
    return () => {
      editor.off("selectionUpdate", syncSelectedImage);
      editor.off("transaction", syncSelectedImage);
    };
  }, [editor]);

  const handleUpdateImage = (updates: {
    width?: string;
    aspectRatio?: string;
    alignment?: "left" | "center" | "right";
  }) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes("image", updates).run();
  };

  const handleTextColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor) return;

    const selectedColor = event.target.value;
    setTextColor(selectedColor);
    getFocusedEditor(editor).setColor(selectedColor).run();
  };

  const options = [
    {
      label: "Đoạn văn",
      onClick: () => {
        if (!editor) return;
        getFocusedEditor(editor).setParagraph().run();
      },
    },
    {
      label: "Tiêu đề 1",
      onClick: () => {
        if (!editor) return;
        getFocusedEditor(editor).toggleHeading({ level: 1 }).run();
      },
    },
    {
      label: "Tiêu đề 2",
      onClick: () => {
        if (!editor) return;
        getFocusedEditor(editor).toggleHeading({ level: 2 }).run();
      },
    },
    {
      label: "Tiêu đề 3",
      onClick: () => {
        if (!editor) return;
        getFocusedEditor(editor).toggleHeading({ level: 3 }).run();
      },
    },
  ];

  const getLabel = (): string => {
    if (!editor) return "Đoạn văn";

    if (editor.isActive("heading", { level: 1 })) return "Tiêu đề 1";
    if (editor.isActive("heading", { level: 2 })) return "Tiêu đề 2";
    if (editor.isActive("heading", { level: 3 })) return "Tiêu đề 3";

    return "Đoạn văn";
  };

  const handleLinkSubmit = ({ url, openInNewTab }: linkOption) => {
    if (!editor) return;

    const { commands } = editor;
    if (openInNewTab) commands.setLink({ href: url, target: "_blank" });
    else commands.setLink({ href: url });
  };

  const handleEmbedYoutube = (url: string) => {
    if (!editor) return;
    editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  const handleEmbedFacebookReels = (url: string) => {
    if (!editor) return;

    let normalizedUrl = url.trim();

    if (!normalizedUrl.includes("facebook.com")) {
      alert("Vui lòng nhập URL Facebook Reels hợp lệ");
      return;
    }

    const encodedUrl = encodeURIComponent(normalizedUrl);
    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=500&height=281`;

    const iframeHtml = `<div class="facebook-reel-embed" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 20px 0; background: #000;">
      <iframe 
        src="${embedUrl}" 
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" 
        scrolling="no" 
        allowtransparency="true" 
        allow="encrypted-media; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen="true"
        loading="lazy">
      </iframe>
    </div>`;

    editor.chain().focus().insertContent(iframeHtml).run();
  };

  const handleEmbedImage = (url: string, altText?: string, caption?: string) => {
    if (!editor) return;
    (editor.chain().focus() as any).setImage({ src: url, alt: altText || "", caption: caption || "" }).run();
  };

  const Head = () => {
    return (
      <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
        <span className="text-sm">{getLabel()}</span>
        <AiFillCaretDown size={12} />
      </div>
    );
  };

  // Early return after all hooks
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Text Formatting Group */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <DropdownOptions options={options} head={<Head />} onToggle={onDropdownToggle} />

        <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1" />

        <Button
          active={editor.isActive("bold")}
          onClick={() => getFocusedEditor(editor).toggleBold().run()}
        >
          <BsTypeBold />
        </Button>

        <Button
          active={editor.isActive("italic")}
          onClick={() => getFocusedEditor(editor).toggleItalic().run()}
        >
          <BsTypeItalic />
        </Button>

        <Button
          active={editor.isActive("underline")}
          onClick={() => getFocusedEditor(editor).toggleUnderline().run()}
        >
          <BsTypeUnderline />
        </Button>

        <Button
          active={editor.isActive("strike")}
          onClick={() => getFocusedEditor(editor).toggleStrike().run()}
        >
          <BsTypeStrikethrough />
        </Button>

        {/* Color Picker */}
        <div className="flex items-center gap-1 ml-1">
          <input
            type="color"
            value={textColor}
            onChange={handleTextColorChange}
            title="Chọn màu chữ"
            className="w-6 h-6 p-0 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Alignment Group */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1" />

        <Button
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <MdFormatAlignLeft />
        </Button>

        <Button
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <MdFormatAlignCenter />
        </Button>

        <Button
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <MdFormatAlignRight />
        </Button>
      </div>

      {/* Media & Tools Group */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1" />
        <EmbedYoutube onSubmit={handleEmbedYoutube} onToggle={onDropdownToggle} />
        <EmbedFacebookReels onSubmit={handleEmbedFacebookReels} />
        <EmbedImage onSubmit={handleEmbedImage} onToggle={onDropdownToggle} />
        
        {/* Cloudinary Gallery */}
        <Button onClick={onOpenImageClick}>
          <BsImageFill title="Chèn một ảnh (Cloudinary)" />
        </Button>

        {/* Cloudflare R2 Upload & Media Manager */}
        {onOpenR2ModalClick && (
          <Button onClick={onOpenR2ModalClick}>
            <div className="flex items-center gap-0.5 text-orange-600 dark:text-orange-400 font-semibold" title="Kho ảnh Cloudflare R2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
              <span className="text-[10px] font-bold tracking-tight">R2</span>
            </div>
          </Button>
        )}

        {/* Cloudflare R2 Gallery */}
        {onOpenR2GalleryClick && (
          <Button onClick={onOpenR2GalleryClick}>
            <div className="flex items-center gap-1 text-[#105d97] dark:text-sky-400 font-semibold" title="Kho Album Gallery từ Cloudflare R2 (Lưu & Chọn nhanh)">
              <BsImages className="w-4 h-4" />
              <span className="text-[9px] font-bold tracking-tight bg-sky-100 dark:bg-sky-950/60 px-1 py-0.2 rounded text-[#105d97] dark:text-sky-300">R2</span>
            </div>
          </Button>
        )}

        {onOpenGalleryClick && (
          <Button onClick={onOpenGalleryClick}>
            <BsImages title="Chèn Gallery ảnh" />
          </Button>
        )}

        <InsertTable editor={editor} />
        <InsertLink onSubmit={handleLinkSubmit} onToggle={onDropdownToggle} />

        {/* Nhóm chức năng Resize & Tỷ lệ ảnh khi đang chọn ảnh trong Editor */}
        {selectedImage && (
          <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/50 px-2 py-1 rounded-lg border border-[#105d97]/40 dark:border-sky-500/40 animate-in fade-in flex-shrink-0">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#105d97] dark:text-sky-300">
              <BsImageFill size={12} />
              <span>Ảnh ({selectedImage.width}):</span>
            </div>

            {/* Resize pills */}
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-md p-0.5 border border-gray-200 dark:border-gray-600 text-[10px]">
              {["25%", "50%", "75%", "100%"].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleUpdateImage({ width: sz })}
                  className={`px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                    (selectedImage.width || "100%") === sz
                      ? "bg-[#105d97] text-white shadow-xs"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title={`Resize ảnh thành ${sz}`}
                >
                  {sz}
                </button>
              ))}
            </div>

            {/* Ratio dropdown */}
            <div className="flex items-center gap-1 text-[11px] bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-600">
              <MdAspectRatio className="text-[#105d97] dark:text-sky-300" size={13} />
              <select
                value={selectedImage.aspectRatio || "auto"}
                onChange={(e) => handleUpdateImage({ aspectRatio: e.target.value })}
                className="bg-transparent text-gray-700 dark:text-gray-200 text-[11px] font-semibold focus:outline-none cursor-pointer"
                title="Chỉnh tỷ lệ khung hình ảnh"
              >
                <option value="auto">Gốc (Auto)</option>
                <option value="16/9">16:9 (Ngang)</option>
                <option value="4/3">4:3 (Chuẩn)</option>
                <option value="1/1">1:1 (Vuông)</option>
                <option value="3/2">3:2 (Nhiếp ảnh)</option>
                <option value="9/16">9:16 (Dọc)</option>
              </select>
            </div>

            {/* Align pills */}
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-md p-0.5 border border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => handleUpdateImage({ alignment: "left" })}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  selectedImage.alignment === "left"
                    ? "bg-[#105d97] text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
                }`}
                title="Căn trái ảnh"
              >
                <MdFormatAlignLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleUpdateImage({ alignment: "center" })}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  (selectedImage.alignment || "center") === "center"
                    ? "bg-[#105d97] text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
                }`}
                title="Căn giữa ảnh"
              >
                <MdFormatAlignCenter size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleUpdateImage({ alignment: "right" })}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  selectedImage.alignment === "right"
                    ? "bg-[#105d97] text-white shadow-xs"
                    : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
                }`}
                title="Căn phải ảnh"
              >
                <MdFormatAlignRight size={13} />
              </button>
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteSelection().run()}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition-colors cursor-pointer"
              title="Xóa ảnh này"
            >
              <MdDeleteOutline size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Content Formatting Group */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-600 mx-1" />

        <Button
          active={editor.isActive("blockquote")}
          onClick={() => getFocusedEditor(editor).toggleBlockquote().run()}
        >
          <RiDoubleQuotesL />
        </Button>

        <Button
          active={editor.isActive("code")}
          onClick={() => getFocusedEditor(editor).toggleCode().run()}
        >
          <BsCode />
        </Button>

        <Button
          active={editor.isActive("codeBlock")}
          onClick={() => getFocusedEditor(editor).toggleCodeBlock().run()}
        >
          <BsBraces />
        </Button>

        <Button
          active={editor.isActive("orderedList")}
          onClick={() => getFocusedEditor(editor).toggleOrderedList().run()}
        >
          <BsListOl />
        </Button>

        <Button
          active={editor.isActive("bulletList")}
          onClick={() => getFocusedEditor(editor).toggleBulletList().run()}
        >
          <BsListUl />
        </Button>
      </div>
    </div>
  );
};

export default ToolBar;
