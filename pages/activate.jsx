// pages/activate.js
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaCheckCircle, FaSpinner } from 'react-icons/fa';

export default function ActivateAccount() {
  const router = useRouter();
  const { token } = router.query;
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          setMessage(data.message);
          setIsSuccess(data.success || data.message.includes('thành công'));
          setIsLoading(false);
        })
        .catch(() => {
          setMessage('Có lỗi xảy ra, vui lòng thử lại.');
          setIsSuccess(false);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [token]);

  return (
    <>
      <Head>
        <title>Kích hoạt tài khoản - Q8Design | Thiết kế kiến trúc và nội thất chuyên nghiệp</title>
        <meta
          name="description"
          content="Kích hoạt tài khoản Q8Design thành công. Tham gia cộng đồng thiết kế kiến trúc và nội thất chuyên nghiệp, tạo nên không gian sống hoàn hảo cho gia đình bạn."
        />
        <meta
          name="keywords"
          content="Q8Design, kích hoạt tài khoản, thiết kế kiến trúc, nội thất, tư vấn thiết kế, kiến trúc sư, thi công trọn gói"
        />
        <link rel="canonical" href="https://q8design.vn/activate" />
        {/* Open Graph */}
        <meta
          property="og:title"
          content="Kích hoạt tài khoản - Q8Design | Thiết kế kiến trúc và nội thất chuyên nghiệp"
        />
        <meta
          property="og:description"
          content="Kích hoạt tài khoản Q8Design thành công. Tham gia cộng đồng thiết kế kiến trúc và nội thất chuyên nghiệp."
        />
        <meta property="og:url" content="https://q8design.vn/activate" />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://q8design.vn/images/q8-design-logo.png"
        />
        <meta
          property="og:image:alt"
          content="Kích hoạt tài khoản Q8Design"
        />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-orange-100"></div>
        </div>

        {/* Main Container */}
        <div className="relative z-10 w-full max-w-md">
          {/* Activation Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            
            {/* Loading State */}
            {isLoading && (
              <>
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-6 text-center">
                  <h1 className="text-2xl font-bold text-white mb-2">Đang kích hoạt tài khoản</h1>
                  <p className="text-orange-100 text-sm">Vui lòng chờ trong giây lát</p>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                  <div className="animate-spin text-4xl text-orange-500 mb-6 flex justify-center">
                    <FaSpinner />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Đang xử lý yêu cầu...
                  </h2>
                  <p className="text-gray-600">Chúng tôi đang kích hoạt tài khoản của bạn</p>
                </div>
              </>
            )}

            {/* Success/Error State */}
            {!isLoading && (
              <>
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-6 text-center">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {isSuccess ? 'Kích hoạt thành công!' : 'Kích hoạt thất bại'}
                  </h1>
                  <p className="text-orange-100 text-sm">
                    {isSuccess ? 'Chào mừng bạn đến với Q8Design' : 'Có lỗi xảy ra trong quá trình kích hoạt'}
                  </p>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                  {/* Status Icon */}
                  <div className="mb-6">
                    {isSuccess ? (
                      <div className="text-6xl text-orange-500 mb-4 flex justify-center">
                        <FaCheckCircle />
                      </div>
                    ) : (
                      <div className="text-6xl text-red-500 mb-4 flex justify-center">
                        ❌
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  {message && (
                    <div className={`p-4 rounded-xl mb-6 ${
                      isSuccess ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      <p className="text-sm font-medium">
                        {message}
                      </p>
                    </div>
                  )}

                  {/* Success Description */}
                  {isSuccess && (
                    <div className="mb-8">
                      <p className="text-gray-700 leading-6 text-sm">
                        Tài khoản của bạn đã được kích hoạt thành công! Chúng tôi rất vui khi bạn đã chọn 
                        gia nhập cộng đồng Q8Design - nơi cung cấp dịch vụ thiết kế kiến trúc và nội thất 
                        chuyên nghiệp, tạo nên không gian sống hoàn hảo cho gia đình bạn.
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Link
                      href="/"
                      className="w-full inline-flex items-center justify-center bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:from-orange-700 hover:to-amber-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      <FaArrowLeft className="mr-2" />
                      Về Trang Chủ
                    </Link>
                    
                    {isSuccess && (
                      <Link
                        href="/dang-nhap"
                        className="w-full inline-flex items-center justify-center bg-white text-orange-600 px-6 py-3 rounded-xl font-bold border-2 border-orange-600 hover:bg-orange-600 hover:text-white transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        Đăng Nhập Ngay
                        <span className="ml-2">🚀</span>
                      </Link>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
