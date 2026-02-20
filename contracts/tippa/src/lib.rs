#![no_std]

mod contract;
mod errors;
mod events;
mod storage;

#[cfg(test)]
mod test;

pub use crate::contract::CascadingDonationsClient;
