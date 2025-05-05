import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className=" mx-auto px-16 py-8 bg-black text-white">
      <div className="content-container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-white/60">
              &copy; {new Date().getFullYear()} Portfolio. Nguyen Thi Yen Nhi.
            </p>
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="text-white/60 hover:text-white text-sm">LinkedIn</a>
            <a href="#" className="text-white/60 hover:text-white text-sm">Instagram</a>
            <a href="#" className="text-white/60 hover:text-white text-sm">Twitter</a>
            <a href="#" className="text-white/60 hover:text-white text-sm">Behance</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
