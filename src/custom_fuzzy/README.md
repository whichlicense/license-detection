# What is this?
Contains the old implementation of the fuzzy search algorithm. It is not used anymore, but it is kept for reference. This algorithm is much faster than the new one as it provides mechanisms for early exit when the score is too low, uses less strings and makes use of a simpler hashing mechanism.

# Why?
The old implementation, while faster, generates a hash string that is **VERY** long.. This is not that ideal with the new situation where we would like to have a more compact hash string to be able to store it entirely in memory and not have to seek around in a file.

This implementation is kept for reference, in case we need to.. you know.... go back.