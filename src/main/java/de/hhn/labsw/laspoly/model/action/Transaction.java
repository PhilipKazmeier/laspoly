package de.hhn.labsw.laspoly.model.action;


import de.hhn.labsw.laspoly.exception.TransactionNotValidException;
import de.hhn.labsw.laspoly.model.Actor;

/**
 * A transaction is a money transfer.
 */
public class Transaction implements Action {

    /**
     * {@link de.hhn.labsw.laspoly.model.Actor} that sends the money amount.
     */
    private Actor sender;

    /**
     * {@link de.hhn.labsw.laspoly.model.Actor} that receives the money amount.
     */
    private Actor receiver;

    /**
     * Amount of money that is transfered.
     */
    private int amount;

    /**
     * Constructor.
     *
     * @param transSender   {@link de.hhn.labsw.laspoly.model.Actor} that sends the money amount.
     * @param transReceiver {@link de.hhn.labsw.laspoly.model.Actor} that receives the money amount.
     * @param transAmount   Amount of money that is transfered. Has to be positive
     *
     * @throws TransactionNotValidException If the amount of money is zero or negative.
     */
    public Transaction(Actor transSender, Actor transReceiver, int transAmount) throws TransactionNotValidException {
        if (amount <= 0) {
            throw new TransactionNotValidException("The amount of money has to be bigger than zero.");
        }
        sender = transSender;
        receiver = transReceiver;
        amount = transAmount;
    }


    @Override
    public void onAction() {
        sender.transactMoney(receiver, amount);
    }

    @Override
    public boolean isActionValid() {
        return sender.getMoneyAmount() > amount;
    }
}
