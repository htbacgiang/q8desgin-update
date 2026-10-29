import { FC, ReactNode, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import AppHead from "../common/AppHead";
import Slidebar from "../backend/Slidebar";

interface Props {
  children: ReactNode;
  title?: string;
}

const AdminLayout: FC<Props> = ({ title, children }): JSX.Element => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.replace(`/dang-nhap?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }

    const role = (session.user as any)?.role;
    if (role !== "admin") {
      router.replace("/");
    }
  }, [session, status, router]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#105d97] border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 font-medium text-sm">Đang kiểm tra quyền truy cập...</span>
        </div>
      </div>
    );
  }

  // Not authenticated or not admin
  if (!session || (session.user as any)?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#105d97] border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 font-medium text-sm">Đang chuyển hướng...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppHead title={title} />
      <div className="flex">
        <Slidebar
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />

        {/* Main content: ml-60 khi mở rộng, ml-16 khi thu gọn */}
        <div
          className={`
            ml-0 flex-grow bg-slate-100 min-h-screen
            transition-all duration-300
            ${collapsed ? "lg:ml-16" : "lg:ml-60"}
          `}
        >
          <main className="bg-white dark:bg-slate-900 min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;
