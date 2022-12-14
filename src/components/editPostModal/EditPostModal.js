import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Picker from "emoji-picker-react";
import { ToastContainer, toast } from "react-toastify";
import { useClickOutside } from "../../utils/useClickOutside";
import useWindowDimensions from "../../utils/useWindowDimensions";
import Context from "../../context/Context";
import "./editpostmodal.css";
import "react-toastify/dist/ReactToastify.css";

const EditPostModal = ({ setShowEditPostModal, post }) => {
    const { _id, postText, postMedia, postMediaType, postAuthor } = post;

    const [val, setVal] = useState(postText);
    const [selectedFile, setSelectedFile] = useState();
    const [preview, setPreview] = useState();
    const [media, setMedia] = useState(postMediaType);
    const [showPicker, setShowPicker] = useState(false);
    const [showLoader, setShowLoader] = useState(false);

    const postTextInputRef = useRef();

    const editPostModalRef = useClickOutside(() => {
        setShowEditPostModal(false);
    }, true);

    const { posts, setPosts, profilePosts, setProfilePosts } =
        useContext(Context);

    const { profileUserId } = useParams();

    const { width } = useWindowDimensions();

    useEffect(() => {
        if (!selectedFile) {
            setPreview(undefined);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [selectedFile, setPreview, postMedia]);

    const onSelectingFile = (e) => {
        if (!e.target.files || e.target.files.length === 0) {
            setSelectedFile(undefined);
            return;
        }
        setSelectedFile(e.target.files[0]);
        if (e.target.className === "postImage") {
            setMedia("img");
        } else {
            setMedia("vid");
        }
    };

    const onEmojiClick = (event, emojiObject) => {
        setVal(val + emojiObject.emoji);
        setShowPicker(false);
        postTextInputRef.current.focus();
    };

    const handlePostEditSubmit = async (e) => {
        e.preventDefault();
        setShowLoader(true);
        let errorMessage;
        try {
            if (val === postText && !selectedFile) {
                toast.error("Please make any change to Edit the post", {
                    position: "top-center",
                    autoClose: 3000,
                });
                return;
            }

            let formData = new FormData();

            // checking if text is updated then add this to formdata
            if (val !== postText) {
                formData.append("postText", val);
            }
            // checking if postMedia is updated then add this to formdata
            if (selectedFile) {
                formData.append("postMedia", selectedFile);
                formData.append("postMediaType", media);
            }

            const res = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/posts/${_id}`,
                {
                    method: "PUT",
                    credentials: "include",
                    body: formData,
                }
            );

            if (res.status === 400) {
                errorMessage = "Please make any change to Edit the post";
                throw new Error(res.statusText);
            } else if (res.status === 401) {
                errorMessage = "You are not authenticated, please login first";
                throw new Error(res.statusText);
            } else if (!res.ok) {
                errorMessage = "Oops! Some problem occurred";
                throw new Error(res.statusText);
            }

            const data = await res.json();

            setShowLoader(false);
            setShowEditPostModal(false);

            if (profileUserId) {
                let newPosts = profilePosts.map((post) => {
                    return post._id === data.updatedPost._id
                        ? data.updatedPost
                        : post;
                });
                setProfilePosts(newPosts);
            } else {
                let newPosts = posts.map((post) => {
                    return post._id === data.updatedPost._id
                        ? data.updatedPost
                        : post;
                });
                setPosts(newPosts);
            }

            toast.success("Post updated successfully...", {
                position: "top-center",
                autoClose: 3000,
            });
        } catch (e) {
            setShowLoader(false);
            toast.error(errorMessage, {
                position: "top-center",
                autoClose: 3000,
            });
            console.log(e);
        }
    };

    return (
        <>
            <div className="edit-post-modal-container">
                <div className="edit-post-modal" ref={editPostModalRef}>
                    <form
                        onSubmit={handlePostEditSubmit}
                        encType="multipart/form-data"
                    >
                        <div className="edit-post-heading">
                            <h2>Edit post</h2>
                        </div>
                        <div
                            className="cross"
                            onClick={() => setShowEditPostModal(false)}
                        >
                            <i className="fas fa-times"></i>
                        </div>
                        <hr />
                        <div className="edit-post-top">
                            <Link to="/profile">
                                <img
                                    src={postAuthor.profileImage}
                                    alt="profile"
                                />
                            </Link>
                            <textarea
                                placeholder="Edit post text"
                                value={val}
                                onChange={(e) => setVal(e.target.value)}
                                ref={postTextInputRef}
                            ></textarea>
                        </div>

                        {(selectedFile || postMedia) && (
                            <div className="edit-post-media-preview-wrapper">
                                {media === "img" ? (
                                    <motion.img
                                        src={preview ? preview : postMedia}
                                        alt="post"
                                        className="edit-post-media-image-preview"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    />
                                ) : (
                                    <motion.video
                                        className="edit-post-media-video-preview"
                                        controls
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <source
                                            src={preview ? preview : postMedia}
                                        ></source>
                                        Your browser does not support the video
                                        tag.
                                    </motion.video>
                                )}
                            </div>
                        )}

                        <div className="edit-post-bottom">
                            <motion.span
                                initial={{ scale: 1 }}
                                whileTap={{ scale: 0.85 }}
                            >
                                <input
                                    type="file"
                                    className="postImage"
                                    name="postMedia"
                                    accept="image/*"
                                    onChange={onSelectingFile}
                                />
                                <svg
                                    className="edit-post-image-icon"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    data-supported-dps="24x24"
                                    fill="currentColor"
                                    width="30"
                                    height="30"
                                    focusable="false"
                                >
                                    <path d="M19 4H5a3 3 0 00-3 3v10a3 3 0 003 3h14a3 3 0 003-3V7a3 3 0 00-3-3zm1 13a1 1 0 01-.29.71L16 14l-2 2-6-6-4 4V7a1 1 0 011-1h14a1 1 0 011 1zm-2-7a2 2 0 11-2-2 2 2 0 012 2z"></path>
                                </svg>
                                <p>Photo</p>
                            </motion.span>

                            <motion.span
                                initial={{ scale: 1 }}
                                whileTap={{ scale: 0.85 }}
                            >
                                <input
                                    type="file"
                                    className="postVideo"
                                    name="postMedia"
                                    accept="video/mp4"
                                    onChange={onSelectingFile}
                                />
                                <svg
                                    className="edit-post-video-icon"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    data-supported-dps="24x24"
                                    fill="currentColor"
                                    width="30"
                                    height="30"
                                    focusable="false"
                                >
                                    <path d="M19 4H5a3 3 0 00-3 3v10a3 3 0 003 3h14a3 3 0 003-3V7a3 3 0 00-3-3zm-9 12V8l6 4z"></path>
                                </svg>
                                <p>Video</p>
                            </motion.span>

                            <motion.span
                                onClick={() => setShowPicker(!showPicker)}
                                style={
                                    showPicker
                                        ? {
                                              background: "#E7F3FF",
                                              borderRadius: 7,
                                          }
                                        : null
                                }
                                initial={{ scale: 1 }}
                                whileTap={{ scale: 0.85 }}
                            >
                                <i
                                    className="far fa-laugh"
                                    style={{
                                        fontSize: "1.5rem",
                                        color: "#f7b928",
                                    }}
                                ></i>
                                <p>Feelings</p>
                            </motion.span>

                            {showPicker && (
                                <Picker
                                    pickerStyle={
                                        width <= 536
                                            ? {
                                                  position: "absolute",
                                                  right: 0,
                                                  top: -330,
                                              }
                                            : {
                                                  position: "absolute",
                                                  left: "42%",
                                                  top: -330,
                                              }
                                    }
                                    onEmojiClick={onEmojiClick}
                                />
                            )}
                        </div>

                        <div className="edit-post-btn-wrapper">
                            <button
                                className="edit-post-btn"
                                type="submit"
                                disabled={showLoader}
                            >
                                {showLoader ? (
                                    <img
                                        src="/images/spiner2.gif"
                                        alt="loader"
                                    />
                                ) : (
                                    <>Save</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <ToastContainer theme="colored" />
        </>
    );
};

export default EditPostModal;
