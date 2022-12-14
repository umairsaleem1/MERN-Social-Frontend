import React, { useState } from "react";
import { motion } from "framer-motion";
import "./social-links.css";
import { useClickOutside } from "../../utils/useClickOutside";

const SocialLinksModal = ({
    setShowSocialModal,
    socialLinks,
    setSocialLinks,
}) => {
    const [links, setLinks] = useState({
        facebook: "",
        instagram: "",
        twitter: "",
    });

    const modal = useClickOutside(() => {
        setShowSocialModal(false);
    }, true);

    const handleLinksChange = (e) => {
        setLinks({ ...links, [e.target.name]: e.target.value });
    };

    const addSocialLinks = () => {
        if (links.facebook && links.instagram && links.twitter) {
            setSocialLinks({ ...links });
        } else if (links.facebook && links.instagram) {
            setSocialLinks({
                ...socialLinks,
                facebook: links.facebook,
                instagram: links.instagram,
            });
        } else if (links.facebook && links.twitter) {
            setSocialLinks({
                ...socialLinks,
                facebook: links.facebook,
                twitter: links.twitter,
            });
        } else if (links.instagram && links.twitter) {
            setSocialLinks({
                ...socialLinks,
                instagram: links.instagram,
                twitter: links.twitter,
            });
        } else if (links.facebook) {
            setSocialLinks({ ...socialLinks, facebook: links.facebook });
        } else if (links.instagram) {
            setSocialLinks({ ...socialLinks, instagram: links.instagram });
        } else if (links.twitter) {
            setSocialLinks({ ...socialLinks, twitter: links.twitter });
        }
        setShowSocialModal(false);
    };

    return (
        <div className="social-modal-container">
            <motion.div
                className="social-modal"
                ref={modal}
                initial={{ y: "-100vh" }}
                animate={{ y: 0 }}
                transition={{ type: "spring" }}
            >
                <i
                    className="fas fa-times social-modal-cross"
                    onClick={() => setShowSocialModal(false)}
                ></i>
                <h1>Let us know more about yourself</h1>
                <h2>Add your social media links</h2>
                <div className="social-media-link">
                    <i className="fab fa-facebook"></i>
                    <input
                        type="url"
                        placeholder="Facebook"
                        name="facebook"
                        value={links.facebook}
                        onChange={handleLinksChange}
                    />
                </div>
                <div className="social-media-link">
                    <i className="fab fa-instagram"></i>
                    <input
                        type="url"
                        placeholder="Instagram"
                        name="instagram"
                        value={links.instagram}
                        onChange={handleLinksChange}
                    />
                </div>
                <div className="social-media-link">
                    <i className="fab fa-twitter"></i>
                    <input
                        type="url"
                        placeholder="Twitter"
                        name="twitter"
                        value={links.twitter}
                        onChange={handleLinksChange}
                    />
                </div>

                <button
                    className="social-media-done-btn"
                    onClick={addSocialLinks}
                >
                    Done
                </button>
            </motion.div>
        </div>
    );
};

export default SocialLinksModal;
