import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    const isAuth = !!token;
    const { pathname } = req.nextUrl;

    const isAuthPage =
      pathname.startsWith("/dang-nhap") || pathname.startsWith("/dang-ky");
    const isAdminPage =
      pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
    const isSetupPage = pathname.startsWith("/admin/setup");

    // Nếu vào trang setup admin
    if (isSetupPage) {
      return NextResponse.next();
    }

    // Nếu vào trang đăng nhập/đăng ký khi đã đăng nhập
    if (isAuthPage) {
      if (isAuth) {
        if (token?.role === "admin") {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.redirect(new URL("/", req.url));
      }
      return NextResponse.next();
    }

    // Nếu vào dashboard/admin mà chưa đăng nhập hoặc không phải admin
    if (isAdminPage) {
      if (!isAuth) {
        const url = new URL("/dang-nhap", req.url);
        url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
        return NextResponse.redirect(url);
      }

      if (token?.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        // Cho phép truy cập trang đăng nhập, đăng ký và setup
        if (
          pathname.startsWith("/dang-nhap") ||
          pathname.startsWith("/dang-ky") ||
          pathname.startsWith("/admin/setup")
        ) {
          return true;
        }

        // Bắt buộc phải có token và role admin với các trang /dashboard và /admin
        return !!token && token.role === "admin";
      },
    },
    pages: {
      signIn: "/dang-nhap",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/dang-nhap",
    "/dang-ky",
  ],
};
