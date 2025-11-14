import React from 'react';
import { 
  FaFacebook, 
  FaYoutube,
  FaLinkedin,
  FaInstagram,
  FaEnvelope, 
  FaPhoneAlt, 
  FaMapMarkerAlt,
  FaHeadset,
  FaInfoCircle,
  FaShieldAlt
} from 'react-icons/fa';
import { IconType } from 'react-icons';

interface SocialIconProps {
  icon: IconType;
  url: string;
  label: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface ContactItemProps {
  icon: IconType;
  text: string | React.ReactNode;
  href?: string;
  className?: string;
  iconSize?: number;
}

const SocialIcon: React.FC<SocialIconProps> = ({ 
  icon: Icon, 
  url, 
  label,
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <a 
      href={url} 
      className={`inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200 ${sizeClasses[size]} ${className}`}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon className="text-white text-lg" />
    </a>
  );
};

const ContactItem: React.FC<ContactItemProps> = ({ 
  icon: Icon, 
  text, 
  href,
  className = '',
  iconSize = 16
}) => {
  const content = (
    <div className={`flex items-start ${className}`}>
      <Icon className="flex-shrink-0 mt-1 text-white/70" size={iconSize} />
      <span className="ml-2 text-white/80 hover:text-white transition-colors">
        {text}
      </span>
    </div>
  );

  return href ? (
    <a href={href} className="block mb-2 last:mb-0">
      {content}
    </a>
  ) : (
    <div className="mb-2 last:mb-0">
      {content}
    </div>
  );
};

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  const examCategories = [
    { name: 'Toán học', url: '#' },
    { name: 'Tiếng Anh', url: '#' },
    { name: 'Vật lý', url: '#' },
    { name: 'Hóa học', url: '#' },
    { name: 'Sinh học', url: '#' },
  ];

  const certifications = [
    { name: 'TOEIC', url: '#' },
    { name: 'IELTS', url: '#' },
    { name: 'AWS', url: '#' },
    { name: 'Microsoft', url: '#' },
    { name: 'Google', url: '#' },
  ];

  const supportLinks = [
    { name: 'Hướng dẫn', url: '#', icon: FaInfoCircle },
    { name: 'FAQ', url: '#', icon: FaHeadset },
    { name: 'Liên hệ', url: '#' },
    { name: 'Báo lỗi', url: '#' },
    { name: 'Phản hồi', url: '#' },
  ];

  const contactInfo = [
    { 
      icon: FaEnvelope, 
      text: 'support@onthitracnghiem.online',
      href: 'mailto:support@onthitracnghiem.online'
    },
    { 
      icon: FaPhoneAlt, 
      text: '1900 1234',
      href: 'tel:19001234'
    },
    { 
      icon: FaMapMarkerAlt, 
      text: 'Hà Nội, Việt Nam',
      href: 'https://maps.google.com/?q=Hà+Nội,+Việt+Nam'
    },
  ];

  const socialLinks = [
    { icon: FaFacebook, url: '#', label: 'Facebook' },
    { icon: FaYoutube, url: '#', label: 'YouTube' },
    { icon: FaInstagram, url: '#', label: 'Instagram' },
    { icon: FaLinkedin, url: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* About Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full mr-3">
                  <FaEnvelope className="text-white text-xl" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">HỆ THỐNG LUYỆN THI</h3>
                  <p className="text-sm text-white/80">TRẮC NGHIỆM TRỰC TUYẾN</p>
                </div>
              </div>
              <p className="text-white/80 mb-6">
                Nền tảng luyện thi trắc nghiệm trực tuyến hàng đầu Việt Nam với hàng nghìn câu hỏi 
                chất lượng cao và hệ thống chấm điểm tự động.
              </p>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => (
                  <SocialIcon 
                    key={index}
                    icon={social.icon}
                    url={social.url}
                    label={social.label}
                    size="md"
                  />
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold text-lg mb-4 pb-2 border-b border-white/20">Thi thử</h4>
              <ul className="space-y-2">
                {examCategories.map((item, index) => (
                  <li key={index}>
                    <a 
                      href={item.url} 
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Certifications */}
            <div>
              <h4 className="text-white font-semibold text-lg mb-4 pb-2 border-b border-white/20">Chứng chỉ</h4>
              <ul className="space-y-2">
                {certifications.map((item, index) => (
                  <li key={index}>
                    <a 
                      href={item.url} 
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support & Contact */}
            <div>
              <h4 className="text-white font-semibold text-lg mb-4 pb-2 border-b border-white/20">Hỗ trợ</h4>
              <ul className="space-y-2 mb-6">
                {supportLinks.map((item, index) => (
                  <li key={index}>
                    <a 
                      href={item.url} 
                      className="flex items-center text-white/80 hover:text-white transition-colors"
                    >
                      {item.icon && <item.icon className="mr-2" size={14} />}
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
              
              <h4 className="text-white font-semibold text-lg mb-4 pb-2 border-b border-white/20">Liên hệ</h4>
              <div className="space-y-3">
                {contactInfo.map((item, index) => (
                  <ContactItem
                    key={index}
                    icon={item.icon}
                    text={item.text}
                    href={item.href}
                    iconSize={14}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-white/70 text-center md:text-left mb-3 md:mb-0">
              © {currentYear} Hệ thống luyện thi trắc nghiệm. Tất cả các quyền được bảo lưu.
            </div>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-sm text-white/70 hover:text-white transition-colors flex items-center"
              >
                <FaShieldAlt className="mr-1" size={12} />
                Điều khoản sử dụng
              </a>
              <a 
                href="#" 
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Chính sách bảo mật
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
