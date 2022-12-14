const followOrUnfollow = async (
    _id,
    isFollowing,
    setIsFollowing,
    setShowFollowLoader,
    user,
    socketRef
) => {
    setShowFollowLoader(true);
    try {
        const res = await fetch(
            `${
                process.env.REACT_APP_API_BASE_URL
            }/profile/${_id}/follow?follow=${!isFollowing}`,
            {
                credentials: "include",
            }
        );

        if (!res.ok) {
            throw new Error(res.statusText);
        }

        const data = await res.json();

        setShowFollowLoader(false);
        setIsFollowing(!isFollowing);

        console.log(data);

        // ############ Creating notification of this new follower

        // if the user who comment on post is not same as the postAuthor then only create notification and send it in realtime to the postAuthor
        if (!isFollowing) {
            let formatedName = user.name
                .split(" ")
                .map((item) => {
                    return item[0].toUpperCase() + item.slice(1);
                })
                .join(" ");

            const newNotification = {
                personId: user._id,
                personName: formatedName,
                personProfileImage: user.profileImage,
                notifiedUser: _id,
                notificationType: "follow",
                notificationText: `started following you.`,
                notificationUserProfileId: user._id,
            };

            // making request to backend to create a new notification of like
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
                "followNotification",
                notiData.savedNotification
            );
        }
    } catch (e) {
        setShowFollowLoader(false);
        console.log(e);
    }
};

export default followOrUnfollow;
