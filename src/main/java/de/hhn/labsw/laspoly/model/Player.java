package de.hhn.labsw.laspoly.model;

import de.hhn.labsw.laspoly.model.GameConfiguration.Money;
import de.hhn.labsw.laspoly.model.card.ActionCard;
import de.hhn.labsw.laspoly.model.card.PropertyCard;

import java.util.ArrayList;
import java.util.List;

/**
 * This class contains all data and actions a player has during a {@link de.hhn.labsw.laspoly.model.Game}. An instance
 * for every {@link de.hhn.labsw.laspoly.model.User} is created when a {@link de.hhn.labsw.laspoly.model.Game} is
 * started. The {@link de.hhn.labsw.laspoly.model.User} controls this class.
 */
public class Player implements Actor {

    /**
     * Ths {@link de.hhn.labsw.laspoly.model.User} of this player.
     */
    private User user;

    /**
     * Money the player has.
     */
    private Integer capital = Money.STARTING_MONEY_AMOUNT_PLAYER;

    /**
     * List of all {@link de.hhn.labsw.laspoly.model.field.Property} the player owns.
     */
    private List<PropertyCard> propertyList;

    /**
     * The {@link de.hhn.labsw.laspoly.model.Figure} of the player.
     */
    private Figure figure = null;

    /**
     * Counter for rounds in {@link de.hhn.labsw.laspoly.model.field.specialfield.Prison}.
     */
    private int prisonCounter = 0;

    /**
     * Counter for doubles rolled by the player.
     */
    private int doubleCounter = 0;

    /**
     * The last roll of the player.
     */
    private int[] lastRoll = {-1, -1};

    /**
     * Owned actioncard of the player.
     */
    private ActionCard actionCard = null;

    /**
     * Constructor.
     *
     * @param user Ths {@link de.hhn.labsw.laspoly.model.User} of this player.
     */
    public Player (User user) {
        this.user = user;
        propertyList = new ArrayList<>();
    }

    /**
     * Called to choose a {@link de.hhn.labsw.laspoly.model.Figure}.
     *
     * @param figure The chosen {@link de.hhn.labsw.laspoly.model.Figure}.
     */
    public void chooseFigure (Figure figure) {
        this.figure = figure;
    }

    /**
     * @return {@link #figure}.
     */
    public Figure getFigure () {
        return figure;
    }

    /**
     * @return {@link #propertyList}.
     */
    public List<PropertyCard> getPropertyList () {
        return propertyList;
    }

    /**
     * @return {@link #lastRoll}.
     */
    public int[] getLastRoll () {
        return lastRoll;
    }

    @Override
    public void transactMoney(Actor actor, int amount) {
        // TODO
    }

    @Override
    public void sendMessage(String message) {
        // TODO
    }

    @Override
    public int getMoneyAmount() {
        return capital;
    }
}
