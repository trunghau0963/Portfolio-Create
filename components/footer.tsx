import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className=" mx-auto px-16 py-8 bg-black text-white">
      <div className="content-container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-white/60">
              &copy; {new Date().getFullYear()} Portfolio. Nguyen Tran Trung Hau.
            </p>
          </div>
          
          <div className="flex space-x-6">
            <a href="https://www.linkedin.com/in/hangu0963/" className="text-white/60 hover:text-white text-sm">LinkedIn</a>
            <a href="https://dribbble.com/TrungHau0963" className="text-white/60 hover:text-white text-sm">Dribble</a>
            <a href="https://www.behance.net/nguynhu37" className="text-white/60 hover:text-white text-sm">Behance</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
