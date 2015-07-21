# Why?

This document lists reasons for various internal decisions so that we'll hopefully never forget them (again).

## Why not keep a rotation lock to prevent the screen from reverting to its natural position?

Because a physical rotation would then have no effect. While STF is meant for larger device farms, we anticipate a large portion of our user base to be running STF on their local computers with the actual devices right next to them, and it would be confusing if rotation suddenly had no effect.
