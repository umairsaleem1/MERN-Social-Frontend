import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Picker from "emoji-picker-react";
import { ToastContainer, toast } from "react-toastify";
import Context from "../../context/Context";
import useWindowDimensions from "../../utils/useWindowDimensions";
import "./createpost.css";
import "react-toastify/dist/ReactToastify.css";

const CreatePost = ({ userImage, userId }) => {
    const [val, setVal] = useState("");
    const [location, setLocation] = useState("");
    const [selectedFile, setSelectedFile] = useState();
    const [preview, setPreview] = useState();
    // state to contain the media type user selected for upload(image or video)
    const [media, setMedia] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [showLocationInput, setShowLocationInput] = useState(false);
    const [showLoader, setShowLoader] = useState(false);

    const postTextInputRef = useRef();

    const { setPosts, setProfilePosts, socketRef } = useContext(Context);

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
    }, [selectedFile, setPreview]);

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

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        let errorMessage;

        if (!val && !selectedFile) {
            toast.error("Please enter something to post!", {
                position: "top-center",
                autoClose: 3000,
            });
            return;
        }

        setShowLoader(true);
        try {
            let formData = new FormData();
            formData.append("text", val);
            formData.append("location", location);
            formData.append("media", media);
            formData.append("postMedia", selectedFile);

            const res = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/posts`,
                {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                }
            );

            if (res.status === 401) {
                errorMessage = "Please login first to create a post";
                throw new Error(res.statusText);
            } else if (res.status === 400) {
                errorMessage = "Please fill out required fields";
                throw new Error(res.statusText);
            } else if (!res.ok) {
                errorMessage = "Oops! Some problem occurred";
                throw new Error(res.statusText);
            }

            const data = await res.json();

            setShowLoader(false);
            setVal("");
            setLocation("");
            setSelectedFile(undefined);
            setPreview(undefined);
            setMedia("");

            if (profileUserId) {
                setProfilePosts((posts) => {
                    return [data.createdPost, ...posts];
                });
            } else {
                setPosts((posts) => {
                    return [data.createdPost, ...posts];
                });
            }

            toast.success("Post created successfully...", {
                position: "top-center",
                autoClose: 3000,
            });

            socketRef.current.emit("newPostUpdate", userId);
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
            <div
                className="create-post"
                style={
                    width <= 580 && !profileUserId
                        ? { marginTop: "-14px" }
                        : null
                }
            >
                <form onSubmit={handlePostSubmit} encType="multipart/form-data">
                    <div className="create-post-top">
                        <Link to={`/profile/${userId}`}>
                            <motion.img
                                src={userImage}
                                alt="profile"
                                initial={{ scale: 1 }}
                                whileTap={{ scale: 0.85 }}
                            />
                        </Link>
                        <input
                            type="text"
                            placeholder="Create a new post"
                            value={val}
                            onChange={(e) => setVal(e.target.value)}
                            ref={postTextInputRef}
                        />
                    </div>
                    {location.length && !showLocationInput ? (
                        <p
                            style={{
                                color: "rgba(0,0,0,0.6)",
                                paddingLeft: 30,
                                marginTop: 10,
                            }}
                        >
                            <i className="fas fa-map-marker-alt"></i>&nbsp;{" "}
                            {location}{" "}
                        </p>
                    ) : null}
                    <hr />

                    {selectedFile && (
                        <div className="post-media-preview-wrapper">
                            {media === "img" ? (
                                <motion.img
                                    src={preview}
                                    alt="post"
                                    className="post-media-image-preview"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                />
                            ) : (
                                <motion.video
                                    className="post-media-video-preview"
                                    controls
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <source src={preview}></source>
                                    Your browser does not support the video tag.
                                </motion.video>
                            )}
                        </div>
                    )}

                    <div className="create-post-bottom">
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
                                className="create-post-image-icon"
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
                                accept="video/*"
                                onChange={onSelectingFile}
                            />
                            <svg
                                className="create-post-video-icon"
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
                            onClick={() =>
                                setShowLocationInput(!showLocationInput)
                            }
                            style={
                                showLocationInput
                                    ? { background: "#E7F3FF", borderRadius: 7 }
                                    : null
                            }
                            initial={{ scale: 1 }}
                            whileTap={{ scale: 0.85 }}
                        >
                            <i
                                className="fas fa-map-marker-alt"
                                style={{ fontSize: "1.3rem", color: "red" }}
                            ></i>
                            <p>Location</p>
                        </motion.span>

                        <motion.span
                            onClick={() => setShowPicker(!showPicker)}
                            style={
                                showPicker
                                    ? { background: "#E7F3FF", borderRadius: 7 }
                                    : null
                            }
                            initial={{ scale: 1 }}
                            whileTap={{ scale: 0.85 }}
                        >
                            <i
                                className="far fa-laugh"
                                style={{ fontSize: "1.5rem", color: "#f7b928" }}
                            ></i>
                            <p>Feelings</p>
                        </motion.span>

                        <motion.button
                            type="submit"
                            disabled={showLoader}
                            initial={{ scale: 1 }}
                            whileTap={{ scale: 0.85 }}
                        >
                            {showLoader ? (
                                <img src="/images/spiner2.gif" alt="loader" />
                            ) : (
                                <>Post</>
                            )}
                        </motion.button>
                    </div>
                    {showLocationInput && (
                        <motion.div
                            className="get-location"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <input
                                type="text"
                                placeholder="Enter Location"
                                onChange={(e) => setLocation(e.target.value)}
                            />
                            <button onClick={() => setShowLocationInput(false)}>
                                Add
                            </button>
                        </motion.div>
                    )}
                    {showPicker && (
                        <Picker
                            pickerStyle={
                                width <= 580
                                    ? { position: "absolute", left: "17%" }
                                    : { position: "absolute", left: "42%" }
                            }
                            onEmojiClick={onEmojiClick}
                        />
                    )}
                </form>
            </div>
            <ToastContainer theme="colored" />
        </>
    );
};

export default CreatePost;
