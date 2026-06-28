package de.hhn.labsw.laspoly.model.action;

import de.hhn.labsw.laspoly.model.Player;
import de.hhn.labsw.laspoly.model.card.PropertyCard;

import java.util.List;

/**
 * This class represents a trading between two {@link de.hhn.labsw.laspoly.model.Player}. It contains all necessary data
 * for a trading.
 */
public class TradingOffer implements Action {

    /**
     * {@link de.hhn.labsw.laspoly.model.Player} sending the offer.
     */
    private Player sender;

    /**
     * {@link de.hhn.labsw.laspoly.model.Player} receiving the offer.
     */
    private Player receiver;

    /**
     * List of {@link de.hhn.labsw.laspoly.model.card.PropertyCard} the sender offers to the receiver.
     */
    private List<PropertyCard> offeredCards;

    /**
     * List of {@link de.hhn.labsw.laspoly.model.card.PropertyCard} the sender desires from the receiver.
     */
    private List<PropertyCard> desiredCards;

    /**
     * Money the sender offers to the receiver.
     */
    private int offeredMoney;

    /**
     * Money the sender desires from the receiver.
     */
    private int desiredMoney;

    /**
     * Status of this offer.
     */
    private Status status;


    /**
     * Constructor.
     *
     * @param offerSender       {@link de.hhn.labsw.laspoly.model.Player} sending the offer.
     * @param offerReceiver     {@link de.hhn.labsw.laspoly.model.Player} receiving the offer.
     * @param offerOfferedCards List of {@link de.hhn.labsw.laspoly.model.card.PropertyCard} the sender offers to the
     *                          receiver.
     * @param offerDesiredCards List of {@link de.hhn.labsw.laspoly.model.card.PropertyCard} the sender desires from the
     *                          receiver.
     * @param offerOfferedMoney Money the sender offers to the receiver.
     * @param offerDesiredMoney Money the sender desires from the receiver.
     */
    public TradingOffer(Player offerSender, Player offerReceiver, List<PropertyCard> offerOfferedCards,
                        List<PropertyCard> offerDesiredCards, int offerOfferedMoney, int offerDesiredMoney) {
        sender = offerSender;
        receiver = offerReceiver;
        offeredCards = offerOfferedCards;
        desiredCards = offerDesiredCards;
        offeredMoney = offerOfferedMoney;
        desiredMoney = offerDesiredMoney;
        status = Status.PENDING;
    }

    /**
     * @return {@link #sender}.
     */
    public Player getSender() {
        return sender;
    }

    /**
     * @return {@link #receiver}.
     */
    public Player getReceiver() {
        return receiver;
    }

    /**
     * @return {@link # offeredCards}.
     */
    public List<PropertyCard> getOfferedCards() {
        return offeredCards;
    }

    /**
     * @return {@link #desiredCards}.
     */
    public List<PropertyCard> getDesiredCards() {
        return desiredCards;
    }

    /**
     * @return {@link #offeredMoney}.
     */
    public int getOfferedMoney() {
        return offeredMoney;
    }

    /**
     * @return {@link #desiredMoney}.
     */
    public int getDesiredMoney() {
        return desiredMoney;
    }

    /**
     * Sets {@link #offeredCards}.
     *
     * @param offeredCards List of {@link de.hhn.labsw.laspoly.model.card.PropertyCard} the sender offers the receiver.
     */
    public void setOfferedCards(List<PropertyCard> offeredCards) {
        this.offeredCards = offeredCards;
    }

    /**
     * Sets {@link #desiredCards};
     *
     * @param desiredCards List of {@link de.hhn.labsw.laspoly.model.card.PropertyCard} the sender desires from the
     *                     receiver.
     */
    public void setDesiredCards(List<PropertyCard> desiredCards) {
        this.desiredCards = desiredCards;
    }


    /**
     * Sets {@link #desiredCards}.
     *
     * @param offeredMoney The money the sender offers to the receiver.
     */
    public void setOfferedMoney(int offeredMoney) {
        this.offeredMoney = offeredMoney;
    }


    /**
     * Sets {@link #desiredMoney}.
     *
     * @param desiredMoney The money the sender desires from the receiver.
     */
    public void setDesiredMoney(int desiredMoney) {
        this.desiredMoney = desiredMoney;
    }


    @Override
    public void onAction() {
        sender.transactMoney(receiver, offeredMoney);
        receiver.transactMoney(sender, desiredMoney);
        for (PropertyCard card : offeredCards) {
            sender.getPropertyList().remove(card);
            receiver.getPropertyList().add(card);
        }
        for (PropertyCard card : desiredCards) {
            receiver.getPropertyList().remove(card);
            sender.getPropertyList().add(card);
        }
    }

    @Override
    public boolean isActionValid() {
        if (sender.getMoneyAmount() < offeredMoney || receiver.getMoneyAmount() < desiredMoney || !hasAllCards(sender,
                offeredCards) || !hasAllCards(receiver, desiredCards)) {
            return false;
        }
        return true;
    }

    /**
     * Checks if a {@link de.hhn.labsw.laspoly.model.Player} has all cards that are in the the list.
     *
     * @param player {@link de.hhn.labsw.laspoly.model.Player} that is tested on owning all cards.
     * @param cards  List of cards that are checked.
     *
     * @return
     */
    public boolean hasAllCards(Player player, List<PropertyCard> cards) {
        for (PropertyCard card : cards) {
            if (!player.getPropertyList().contains(card)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @return {@link de.hhn.labsw.laspoly.model.action.TradingOffer.Status} of this offer.
     */
    public Status getStatus() {
        return status;
    }

    /**
     * Sets the status of this offer.
     *
     * @param status {@link de.hhn.labsw.laspoly.model.action.TradingOffer.Status}.
     */
    public void setStatus(Status status) {
        this.status = status;
    }

    /**
     * Enumeration for the status of this offer.
     */
    public enum Status {
        PENDING, ACCEPTED, DECLINED
    }
}
