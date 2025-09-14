
use starknet::get_caller_address;
use snforge_std::EventSpyAssertionsTrait;
use starknet::contract_address;
use contracts::counter::ICounterDispatcherTrait;
use snforge_std::{declare,ContractClassTrait,DeclareResultTrait,spy_events,start_cheat_caller_address,stop_cheat_caller_address,set_balance,Token};
use starknet::ContractAddress;
use contracts::counter::{ICounterDispatcher};
use contracts::counter::CounterContract::{CounterChanged,ChangeReason,Event};
use contracts::utils::{strk_address,strk_to_fri};
use openzeppelin_token::erc20::interface::{IERC20Dispatcher,IERC20DispatcherTrait};

fn owner_address() -> ContractAddress{
    'owner'.try_into().unwrap()
}

fn user_address() -> ContractAddress{
    'user'.try_into().unwrap()
}

fn deploy_counter(init_counter: u32) -> ICounterDispatcher{
    let contract = declare("CounterContract").unwrap().contract_class();

    let owner_address: ContractAddress = owner_address();

    let mut constructor_args = array![];
    init_counter.serialize(ref constructor_args);
    owner_address.serialize(ref constructor_args);

    let (contract_address,_) = contract.deploy(@constructor_args).unwrap();

    ICounterDispatcher{contract_address: contract_address}
}

#[test]
fn test_contrat_initialization(){
    let dispacher = deploy_counter(5);
    let current_counter: u32 = dispacher.get_counter();
    let expected_counter : u32 = 5;
    assert!(current_counter == expected_counter,"Initialization of counter failed");
}

#[test]
fn test_increase_counter(){
    let init_counter: u32 = 0;
    let dispacher = deploy_counter(init_counter);
    let mut spy = spy_events();

    start_cheat_caller_address(dispacher.contract_address,user_address());
    dispacher.increase_counter();
    stop_cheat_caller_address(dispacher.contract_address);

    let current_counter: u32 = dispacher.get_counter();

    assert!(current_counter == 1,"Increase counter funtion doesn't work");

    let expected_event= CounterChanged{
        old_value: 0,
        new_value: 1,
        caller: user_address(),
        reason: ChangeReason::Increase,
    };

    spy.assert_emitted(@array![
        (dispacher.contract_address,
        Event::CounterChanged(expected_event),
    )])
}

#[test]
fn test_decrease_counter_happy_path(){
    let init_counter: u32 = 4;
    let dispacher = deploy_counter(init_counter);
    let mut spy = spy_events();

    start_cheat_caller_address(dispacher.contract_address,user_address());
    dispacher.decrease_counter();
    stop_cheat_caller_address(dispacher.contract_address);

    let current_counter: u32 = dispacher.get_counter();

    assert!(current_counter == 3,"Decrease counter funtion doesn't work");

    let expected_event= CounterChanged{
        old_value: 4,
        new_value: 3,
        caller: user_address(),
        reason: ChangeReason::Decrease,
    };

    spy.assert_emitted(@array![
        (dispacher.contract_address,
        Event::CounterChanged(expected_event),
    )])
}

#[test]
#[should_panic(expected:"The counter can't be negative")]
fn test_decrease_counter_fail_path(){
    let init_counter: u32 = 0;
    let dispacher = deploy_counter(init_counter);

    dispacher.decrease_counter();
    dispacher.get_counter();
}

#[test]
fn test_set_counter_owner(){
    let init_counter: u32 = 8;
    let dispacher = deploy_counter(init_counter);
    let mut spy = spy_events();

    let new_counter: u32 = 15;
    start_cheat_caller_address(dispacher.contract_address,owner_address());
    dispacher.set_counter(new_counter);
    stop_cheat_caller_address(dispacher.contract_address);

    assert!(dispacher.get_counter() == new_counter,"The owner is unable to reset the counter");

    let expected_event= CounterChanged{
        old_value: init_counter,
        new_value: new_counter,
        caller: owner_address(),
        reason: ChangeReason::Set,
    };

    spy.assert_emitted(@array![
        (dispacher.contract_address,
        Event::CounterChanged(expected_event),
    )])
}

#[test]
#[should_panic]
fn test_set_counter_non_owner(){
    let init_counter: u32 = 8;
    let dispacher = deploy_counter(init_counter);

    let new_counter: u32 = 15;
    start_cheat_caller_address(dispacher.contract_address,user_address());
    dispacher.set_counter(new_counter);
}

#[test]
#[should_panic(expected:"User doesn't have enough balance")]
fn test_reset_counter_insufficient_balance(){
    let init_counter: u32 = 8;
    let dispacher = deploy_counter(init_counter);

    start_cheat_caller_address(dispacher.contract_address,user_address());
    dispacher.reset_counter();
}

#[test]
#[should_panic(expected:"Contract is not allowed to spend enough STRK")]
fn test_reset_counter_insufficient_allowance(){
    let init_counter: u32 = 8;
    let dispacher = deploy_counter(init_counter);

    let caller = user_address();

    set_balance(caller, strk_to_fri(10), Token::STRK);

    start_cheat_caller_address(dispacher.contract_address,caller);
    dispacher.reset_counter();
}

#[test]
fn test_reset_counter_success(){
    let init_counter: u32 = 8;
    let counter = deploy_counter(init_counter);
    let mut spy = spy_events();

    let user = user_address();

    set_balance(user, strk_to_fri(10), Token::STRK);
    let erc_20 = IERC20Dispatcher {contract_address: strk_address()};

    start_cheat_caller_address(erc_20.contract_address,user);
    erc_20.approve(counter.contract_address,strk_to_fri(5));
    stop_cheat_caller_address(erc_20.contract_address);

    start_cheat_caller_address(counter.contract_address,user);
    counter.reset_counter();
    stop_cheat_caller_address(counter.contract_address);

    assert!(counter.get_counter() == 0,"Unable to reset counter even with enough STRK");

    let expected_event= CounterChanged{
        old_value: init_counter,
        new_value: 0,
        caller: user,
        reason: ChangeReason::Reset,
    };

    spy.assert_emitted(@array![
        (counter.contract_address,
        Event::CounterChanged(expected_event),
    )]);

    assert!(erc_20.balance_of(user) == strk_to_fri(9),"Balance not deducted correctly");

    assert!(erc_20.balance_of(owner_address()) == strk_to_fri(1),"Balance not increased correctly");

}
