import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Picker from "emoji-picker-react";
import TimeAgo from "timeago-react";
import useSound from "use-sound";
import { ToastContainer, toast } from "react-toastify";
import { useClickOutside } from "../../utils/useClickOutside";
import formatName from "../../utils/formatName";
import SingleComment from "../singleComment/SingleComment";
import EditPostModal from "../editPostModal/EditPostModal";
import Context from "../../context/Context";
import "./singlepost.css";
import "react-toastify/dist/ReactToastify.css";
import likeSound from "../../sounds/like.mp3";

const SinglePost = ({
    post,
    loggedInUser,
    pageNo,
    fromNotificationDetails,
}) => {
    const {
        _id,
        postText,
        postMedia,
        postMediaType,
        postLocation,
        postAuthor,
        postLikes,
        createdAt,
    } = post;
    const { profileImage, username, role, name } = loggedInUser;

    const [postComments, setPostComments] = useState(post.postComments);
    const [selectedFile, setSelectedFile] = useState();
    const [preview, setPreview] = useState();
    const [showPostOptions, setShowPostOptions] = useState(false);

    // var that will tell either the post is liked or not by the currently loggedIn user
    const [liked, setLiked] = useState(() => {
        return postLikes.some((postLike) => {
            return postLike._id === loggedInUser._id;
        });
    });

    const [showLikesList, setShowLikesList] = useState(false);

    const likesList = useClickOutside(() => {
        setTimeout(() => {
            setShowLikesList(false);
        }, 200);
    }, showLikesList);

    const [myComment, setMyComment] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [showCommentsSection, setShowCommentsSection] = useState(false);

    const myCommentInputRef = useRef();

    const [isPostOptionsBtnVisible, setIsPostOptionsBtnVisible] =
        useState(false);

    const postOptions = useClickOutside(() => {
        setTimeout(() => {
            setShowPostOptions(false);
        }, 200);
    }, isPostOptionsBtnVisible);

    const [showEditPostModal, setShowEditPostModal] = useState(false);

    const {
        posts,
        setPosts,
        profilePosts,
        setProfilePosts,
        socketRef,
        onlineUsers,
    } = useContext(Context);

    const { profileUserId } = useParams();
    const [showLoader, setShowLoader] = useState(false);
    const [playLikeSound] = useSound(likeSound);

    // changing the button visible state if the user is or the author of the post or is an admin of the app
    useEffect(() => {
        if (role === "admin" || postAuthor.username === username) {
            setIsPostOptionsBtnVisible(true);
        }
    }, [username, role, postAuthor.username]);

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
    };

    const onEmojiClick = (event, emojiObject) => {
        setMyComment(myComment + emojiObject.emoji);
        setShowPicker(false);
        myCommentInputRef.current.focus();
    };

    const removeMyCommentImage = () => {
        setSelectedFile("");
        setPreview(undefined);
    };

    const handleDeletePost = async () => {
        let errorMessage;
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/posts/${_id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (res.status === 401) {
                errorMessage = "User is not authenticated, please login first";
                throw new Error(res.statusText);
            } else if (!res.ok) {
                errorMessage = "Oops! Some problem occurred";
                throw new Error(res.statusText);
            }

            const data = await res.json();

            if (profileUserId) {
                let newPosts = profilePosts.filter((post) => {
                    return post._id !== _id;
                });
                setProfilePosts(newPosts);
            } else {
                let newPosts = posts.filter((post) => {
                    return post._id !== _id;
                });
                setPosts(newPosts);
            }

            toast.success(data.message, {
                position: "top-center",
                autoClose: 3000,
            });
        } catch (e) {
            toast.error(errorMessage, {
                position: "top-center",
                autoClose: 3000,
            });
            console.log(e);
        }
    };

    const handlePostLike = async () => {
        setTimeout(() => {
            playLikeSound();
        }, 200);
        try {
            const res = await fetch(
                `${
                    process.env.REACT_APP_API_BASE_URL
                }/posts/${_id}/like?liked=${!liked}`,
                {
                    credentials: "include",
                }
            );
            if (!res.ok) {
                throw new Error(res.statusText);
            }

            await res.json();

            // if liked then remove(false) it, otherwise add(true) it in state variable
            if (liked === true) {
                let arr = [];
                for (let postLike of postLikes) {
                    arr.push(postLike._id);
                }
                let ind = arr.indexOf(loggedInUser._id);
                postLikes.splice(ind, 1);
            } else {
                postLikes.push(loggedInUser);
            }
            setLiked(!liked);

            // ############ Creating notification of this new like

            // if the user who liked on post is not same as the postAuthor then only create notification and send it in realtime to the postAuthor
            if (loggedInUser._id !== postAuthor._id && !liked) {
                let formatedName = formatName(name);

                let notificationTextType = "Post.";
                if (postMediaType === "img") {
                    notificationTextType = "Photo.";
                } else if (postMediaType === "vid") {
                    notificationTextType = "Video.";
                }
                const newNotification = {
                    personId: loggedInUser._id,
                    personName: formatedName,
                    personProfileImage: profileImage,
                    notifiedUser: postAuthor._id,
                    notificationType: "like",
                    notificationText: `liked your ${notificationTextType}`,
                    notificationPost: _id,
                };

                const notiRes = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/notifications`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(newNotification),
                    }
                );

                if (!notiRes.ok) {
                    throw new Error(notiRes.statusText);
                }

                const notiData = await notiRes.json();

                socketRef.current.emit(
                    "likeNotification",
                    notiData.savedNotification
                );
            }

            socketRef.current.emit(
                "likePostUpdate",
                _id,
                postAuthor._id,
                loggedInUser,
                !liked
            );
        } catch (e) {
            console.log(e);
        }
    };

    const handlePostCommentSubmit = async (e) => {
        e.preventDefault();
        let errorMessage;

        if (!myComment && !selectedFile) {
            toast.error("Please enter something to make a comment!", {
                position: "top-center",
                autoClose: 3000,
            });
            return;
        }

        setShowLoader(true);
        try {
            let formData = new FormData();
            formData.append("commentText", myComment);
            formData.append("commentImage", selectedFile);

            const res = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/posts/${_id}/comments`,
                {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                }
            );

            if (res.status === 401) {
                errorMessage =
                    "You are not authenticated, please login first to make comment";
                throw new Error(res.statusText);
            } else if (res.status === 400) {
                errorMessage =
                    "Please fill out the required fields to make comment";
                throw new Error(res.statusText);
            } else if (!res.ok) {
                errorMessage = "Oops! some problem occurred";
                throw new Error(res.statusText);
            }

            const data = await res.json();
            setPostComments((comments) => {
                return [data.createdComment, ...comments];
            });

            setMyComment("");
            setSelectedFile("");
            setPreview(undefined);
            setShowLoader(false);

            toast.success("Comment created successfully...", {
                position: "top-center",
                autoClose: 3000,
            });

            // ############ Creating notification of this newly created comment

            // if the user who comment on post is not same as the postAuthor then only create notification and send it in realtime to the postAuthor
            if (loggedInUser._id !== postAuthor._id) {
                let formatedName = formatName(name);

                let notificationTextType = "Post.";
                if (postMediaType === "img") {
                    notificationTextType = "Photo.";
                } else if (postMediaType === "vid") {
                    notificationTextType = "Video.";
                }
                const newNotification = {
                    personId: loggedInUser._id,
                    personName: formatedName,
                    personProfileImage: profileImage,
                    notifiedUser: postAuthor._id,
                    notificationType: "comment",
                    notificationText: `commented on your ${notificationTextType}`,
                    notificationPost: _id,
                };

                const notiRes = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/notifications`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(newNotification),
                    }
                );

                if (!notiRes.ok) {
                    errorMessage = "OOps! some problem occurred";
                    throw new Error(notiRes.statusText);
                }

                const notiData = await notiRes.json();

                socketRef.current.emit(
                    "commentNotification",
                    notiData.savedNotification
                );
            }

            socketRef.current.emit(
                "newCommentUpdate",
                _id,
                postAuthor._id,
                loggedInUser._id,
                data.createdComment
            );
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
            <div className="singlepost">
                <div className="userinfo">
                    <span className="userinfo-wrapper">
                        <Link to={`/profile/${postAuthor._id}`}>
                            <motion.img
                                src={postAuthor.profileImage}
                                alt="profile"
                                initial={{ scale: 1 }}
                                whileTap={{ scale: 0.85 }}
                            />
                        </Link>
                        {onlineUsers.includes(String(postAuthor._id)) && (
                            <i
                                className="fas fa-circle"
                                style={{
                                    color: "green",
                                    fontSize: 15,
                                    position: "absolute",
                                    bottom: 0,
                                    left: 30,
                                }}
                            ></i>
                        )}
                        <span>
                            <Link
                                to={`/profile/${postAuthor._id}`}
                                className="link-text-decoration"
                            >
                                <h4>{formatName(postAuthor.name)}</h4>
                            </Link>
                            <span>
                                {" "}
                                <TimeAgo datetime={createdAt} />{" "}
                            </span>
                        </span>
                    </span>

                    {role === "admin" || postAuthor.username === username ? (
                        <motion.span
                            className="post-options"
                            onClick={() => setShowPostOptions(!showPostOptions)}
                            style={
                                showPostOptions
                                    ? { background: "#E7F3FF", color: "blue" }
                                    : { background: "#E4E6EB", color: "black" }
                            }
                            ref={postOptions}
                            id="postOptions"
                            initial={{ scale: 1 }}
                            whileTap={{ scale: 0.8 }}
                        >
                            <p>...</p>
                        </motion.span>
                    ) : null}

                    <div
                        className="post-options-list"
                        style={
                            showPostOptions
                                ? { display: "block" }
                                : { display: "none" }
                        }
                    >
                        <div
                            style={{ marginBottom: "10px" }}
                            onClick={() => setShowEditPostModal(true)}
                        >
                            <i
                                className="far fa-edit"
                                style={{ color: "green" }}
                            ></i>
                            <p>Edit post</p>
                        </div>
                        <div onClick={handleDeletePost}>
                            <i
                                className="far fa-trash-alt"
                                style={{ color: "red" }}
                            ></i>
                            <p>Delete post</p>
                        </div>
                    </div>

                    {showEditPostModal && (
                        <EditPostModal
                            setShowEditPostModal={setShowEditPostModal}
                            post={post}
                        />
                    )}
                </div>
                {postLocation ? (
                    <p className="post-location">
                        <i className="fas fa-map-marker-alt"></i>&nbsp;{" "}
                        {postLocation}{" "}
                    </p>
                ) : null}
                {postText ? <p className="post-text"> {postText} </p> : null}

                {postMediaType.length ? (
                    postMediaType === "img" ? (
                        <img src={postMedia} alt="post" />
                    ) : (
                        <video controls>
                            <source src={postMedia}></source>
                        </video>
                    )
                ) : null}
                <div className="post-stats">
                    {postLikes.length ? (
                        <span className="post-likes-count">
                            <span
                                onClick={() => setShowLikesList(!showLikesList)}
                            >
                                <i className="fas fa-heart"></i>
                            </span>
                            {
                                <p
                                    onClick={() =>
                                        setShowLikesList(!showLikesList)
                                    }
                                >
                                    &nbsp;&nbsp;{postLikes.length}
                                </p>
                            }
                        </span>
                    ) : (
                        <span></span>
                    )}
                    {postComments.length ? (
                        <p
                            className="post-comments-count"
                            onClick={() =>
                                setShowCommentsSection(!showCommentsSection)
                            }
                        >
                            {postComments.length === 1
                                ? postComments.length + " comment"
                                : postComments.length + " comments"}
                        </p>
                    ) : null}

                    {showLikesList && (
                        <div className="post-liked-persons" ref={likesList}>
                            <div className="post-liked-person">
                                {postLikes.map((postLike) => {
                                    return postLike._id ? (
                                        <Link
                                            to={`profile/${postLike._id}`}
                                            className="link-text-decoration"
                                            key={postLike._id}
                                        >
                                            <div>
                                                <img
                                                    src={postLike.profileImage}
                                                    alt="profile"
                                                />
                                                {onlineUsers.includes(
                                                    String(postLike._id)
                                                ) && (
                                                    <i
                                                        className="fas fa-circle"
                                                        style={{
                                                            color: "green",
                                                            fontSize: 12,
                                                            position:
                                                                "absolute",
                                                            bottom: 3,
                                                            left: 25,
                                                        }}
                                                    ></i>
                                                )}
                                                <h5>
                                                    {formatName(postLike.name)}
                                                </h5>
                                            </div>
                                        </Link>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}
                </div>
                <div className="post-stats-separator">
                    <hr />
                </div>
                <div className="post-reactions">
                    <motion.div
                        onClick={handlePostLike}
                        style={liked ? { color: "blue" } : null}
                        initial={{ scale: 1 }}
                        whileTap={{ scale: 0.85 }}
                    >
                        {liked ? (
                            <>
                                <motion.i
                                    className="fas fa-heart"
                                    style={{ color: "red" }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1.1 }}
                                    transition={{ type: "spring" }}
                                ></motion.i>
                                &nbsp;&nbsp;Liked
                            </>
                        ) : (
                            <>
                                <i className="far fa-heart"></i>&nbsp;&nbsp;Like
                            </>
                        )}
                    </motion.div>
                    <motion.div
                        onClick={() => setShowCommentsSection(true)}
                        initial={{ scale: 1 }}
                        whileTap={{ scale: 0.85 }}
                    >
                        <i className="far fa-comment-alt"></i>
                        &nbsp;&nbsp;Comment
                    </motion.div>
                </div>
                {(showCommentsSection || fromNotificationDetails) && (
                    <div className="post-stats-separator">
                        <hr />
                    </div>
                )}
                {(showCommentsSection || fromNotificationDetails) && (
                    <div className="post-comments-section">
                        <div className="mycomment-div">
                            <form
                                onSubmit={handlePostCommentSubmit}
                                encType="multipart/form-data"
                            >
                                <Link to={`profile/${loggedInUser._id}`}>
                                    <img
                                        src={profileImage}
                                        alt="profile"
                                        className="profile-image"
                                    />
                                </Link>
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    className="mycomment-textInput"
                                    ref={myCommentInputRef}
                                    value={myComment}
                                    onChange={(e) =>
                                        setMyComment(e.target.value)
                                    }
                                />

                                <span
                                    title="Add an emoji"
                                    onClick={() => setShowPicker(!showPicker)}
                                >
                                    <i className="far fa-smile"></i>
                                </span>

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    data-supported-dps="24x24"
                                    fill="currentColor"
                                    width="24"
                                    height="24"
                                    focusable="false"
                                >
                                    <path d="M19 4H5a3 3 0 00-3 3v10a3 3 0 003 3h14a3 3 0 003-3V7a3 3 0 00-3-3zm1 13a1 1 0 01-.29.71L16 14l-2 2-6-6-4 4V7a1 1 0 011-1h14a1 1 0 011 1zm-2-7a2 2 0 11-2-2 2 2 0 012 2z"></path>
                                </svg>

                                {showPicker && (
                                    <Picker
                                        pickerStyle={{
                                            position: "absolute",
                                            right: 17,
                                            top: -330,
                                        }}
                                        onEmojiClick={onEmojiClick}
                                    />
                                )}
                                <input
                                    type="file"
                                    className="mycomment-Fileinput"
                                    name="commentImage"
                                    accept="image/*"
                                    onChange={onSelectingFile}
                                />
                                {selectedFile && (
                                    <div className="mycomment-image-preview">
                                        <motion.div
                                            onClick={removeMyCommentImage}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.9 }}
                                        >
                                            <i className="fas fa-times"></i>
                                        </motion.div>
                                        <motion.img
                                            src={preview}
                                            alt="comment"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                        />
                                    </div>
                                )}
                                {selectedFile || myComment.length ? (
                                    <motion.button
                                        type="submit"
                                        style={
                                            selectedFile
                                                ? {
                                                      position: "absolute",
                                                      right: "17px",
                                                      bottom: 0,
                                                  }
                                                : null
                                        }
                                        disabled={showLoader}
                                        initial={{ scale: 1, opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        whileTap={{ scale: 0.85 }}
                                    >
                                        {showLoader ? (
                                            <img
                                                src="/images/spiner2.gif"
                                                alt="loader"
                                            />
                                        ) : (
                                            <>Post</>
                                        )}
                                    </motion.button>
                                ) : null}
                            </form>
                        </div>
                        <div
                            className="post-comments"
                            style={
                                postComments.length
                                    ? null
                                    : { marginTop: "10px" }
                            }
                        >
                            {postComments.length
                                ? postComments
                                      .sort(
                                          (a, b) =>
                                              new Date(b.createdAt) -
                                              new Date(a.createdAt)
                                      )
                                      .map((postComment) => {
                                          return (
                                              <SingleComment
                                                  key={postComment._id}
                                                  postComment={postComment}
                                                  postId={_id}
                                                  postAuthor={postAuthor}
                                                  postComments={postComments}
                                                  setPostComments={
                                                      setPostComments
                                                  }
                                              />
                                          );
                                      })
                                : null}
                        </div>
                    </div>
                )}
            </div>
            <ToastContainer theme="colored" />
        </>
    );
};

export default SinglePost;
