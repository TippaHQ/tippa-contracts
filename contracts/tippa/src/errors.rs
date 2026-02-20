use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    ProjectNotFound      = 1,
    NotOwner             = 2,
    TooManyRules         = 3,
    RulesTotalExceedsMax = 4,
    SelfReference        = 5,
    InvalidPercentage    = 6,
    NothingToDistribute  = 7,
    NicknameAlreadyTaken = 8,
    InvalidAmount        = 9,
    ProjectAlreadyExists = 10,
    RulesNotSet          = 11,
    RecipientNotRegistered = 12,
}
