const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");

// Load Post validation
const validatePostInput = require("../../validation/post");

// @route GET api/posts/test
// Test Route
// access PUBLIC
router.get("/test", (req, res) =>
  res.json({
    msg: "Post Works"
  })
);

// @route GET api/posts
// Get Posts
// access Public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(post => {
      res.json(post);
    })
    .catch(err => {
      res.status(404).json({ nopostfond: "No Post found" });
    });
});
// @route GET api/posts/:id
// Get Post by ID
// access Public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .sort({ date: -1 })
    .then(post => {
      res.json(post);
    })
    .catch(err => {
      res.status(404).json({ nopostfond: "No Post found with this ID" });
    });
});

// @route Post api/posts
// Create Post
// access Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }
    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });
    newPost.save().then(post => {
      res.json(post);
    });
  }
);

// @route Post api/posts/:id
// Delete Post
// access Private
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          // Check for post owner
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ notauthorized: "User not authorized" });
          }
          // Delete
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err => {
          res.status(404).json({ postnotfound: "No Post Found" });
        });
    });
  }
);

// @route Post api/posts/like/:id
// Like Post
// access Private
router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: "User already liked this post" });
          }
          // Add user id to like array
          post.likes.unshift({ user: req.user.id });
          post.save().then(post => {
            res.json(post);
          });
        })
        .catch(err => {
          res.status(404).json({ postnotfound: "No Post Found" });
        });
    });
  }
);

// @route Post api/posts/unlike/:id
// Unlike Post
// access Private
router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: "You have not yet liked this post" });
          }
          // Get remove index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);

          // Splice out of array
          post.likes.splice(removeIndex, 1);

          // Save
          post.save().then(post => {
            res.json(post);
          });
        })
        .catch(err => {
          res.status(404).json({ postnotfound: "No Post Found" });
        });
    });
  }
);

// @route Post api/posts/comment/:id
// Comment Post
// access Private
router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }
    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };
        // Add to comments array
        post.comments.unshift(newComment);

        // Save
        post.save().then(post => {
          res.json(post);
        });
      })
      .catch(err => {
        res.status(404).json({ nopostfound: "No post found" });
      });
  }
);

// @route Delete api/posts/comment/:id/:comment_id
// Delete Comment
// access Private
router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        // Check if comment exists
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexists: "Comments does not exists" });
        }

        // Get remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        // Splice out of array
        post.comments.splice(removeIndex, 1);

        // Save
        post.save().then(post => {
          res.json(post);
        });
      })
      .catch(err => {
        res.status(404).json({ nopostfound: "No post found" });
      });
  }
);

module.exports = router;