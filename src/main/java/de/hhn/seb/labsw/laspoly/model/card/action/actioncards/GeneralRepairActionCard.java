/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.action.actioncards;

import de.hhn.seb.labsw.laspoly.exception.InvalidActionIdentifierException;
import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.RepairTransactionActionCard;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.util.Locale;

public class GeneralRepairActionCard
extends RepairTransactionActionCard {
    private final boolean withFactory;
    private int valHouse = -1;
    private int valHotel = -1;
    private int valFactory = -1;

    public GeneralRepairActionCard(Locale loc, String identifier, int multiplierVal, boolean repairWithFactory) throws InvalidActionIdentifierException {
        super(loc, identifier, multiplierVal);
        this.withFactory = repairWithFactory;
    }

    @Override
    protected void onAction(Figure fig, GameHandler handler) {
        Player player = handler.getPlayer(fig.getUser());
        int housesCounter = player.getAllHouses().size();
        int hotelCounter = player.getAllHotels().size();
        int factoryCounter = player.getAllFactories().size();
        int amount = 0;
        amount += housesCounter * this.valHouse;
        amount += hotelCounter * this.valHotel;
        if (this.withFactory) {
            amount += factoryCounter * this.valFactory;
        }
        if (amount > 0) {
            if (handler.getPlayer(fig.getUser()).removeMoney(amount)) {
                TransactionAction transaction = new TransactionAction(fig.getUser(), amount, false, fig.getUser());
                handler.addAction(transaction);
            } else {
                handler.kickPlayer(fig.getUser(), "lostNoMoneyLeft");
            }
        }
    }

    @Override
    protected void prepare(GameHandler handler) {
        String text;
        this.valHouse = ((int)(Math.random() * 2.0) + 1) * this.getMultiplier();
        this.valHotel = ((int)(Math.random() * 4.0) + 1) * this.getMultiplier();
        if (this.withFactory) {
            this.valFactory = ((int)(Math.random() * 3.0) + 1) * this.getMultiplier();
            text = String.format(this.getBundle().getString(this.getIdentifier()), this.valHouse, this.valHotel, this.valFactory);
            this.setValues(this.valHouse, this.valHotel, this.valFactory);
        } else {
            text = String.format(this.getBundle().getString(this.getIdentifier()), this.valHouse, this.valHotel);
            this.setValues(this.valHouse, this.valHotel);
        }
        this.getActionCardText().setText(text);
    }
}

