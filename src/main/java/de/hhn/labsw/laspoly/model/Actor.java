package de.hhn.labsw.laspoly.model;

/**
 * An actor is an object that is able to do specific things like transacting money, sending messages.
 */
public interface Actor {

    /**
     * Tranfers money from the current actor to the actor given as parameter.
     *
     * @param actor  Actor the money is transacted to.
     * @param amount Money that is transfered.
     */
    public void transactMoney(Actor actor, int amount);

    /**
     * Sends a message.
     *
     * @param message Message that is send.
     */
    public void sendMessage(String message);

    /**
     * @return The amount of money this actor has.
     */
    public int getMoneyAmount();

}
