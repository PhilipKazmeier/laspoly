/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.action.actioncards;

import de.hhn.seb.labsw.laspoly.exception.InvalidActionIdentifierException;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.TransactionActionCard;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.util.Locale;

public class SingleTransactionActionCard
extends TransactionActionCard {
    private int val = -1;

    public SingleTransactionActionCard(Locale loc, String identifier, boolean pos, int multiplierVal) throws InvalidActionIdentifierException {
        super(loc, identifier, pos, multiplierVal);
        if (!this.getBundle().getString(this.getIdentifier()).contains("%d")) {
            throw new InvalidActionIdentifierException("%d");
        }
    }

    @Override
    protected void prepare(GameHandler handler) {
        this.val = ((int)(Math.random() * 5.0) + 1) * this.getMultiplier();
        String text = String.format(this.getBundle().getString(this.getIdentifier()), this.val);
        this.getActionCardText().setText(text);
        this.setValues(this.val);
    }

    @Override
    protected void onAction(Figure fig, GameHandler handler) {
        if (this.isPositive()) {
            handler.getPlayer(fig.getUser()).addMoney(this.val);
            TransactionAction transaction = new TransactionAction(fig.getUser(), this.val, true, fig.getUser());
            handler.addAction(transaction);
        } else if (handler.getPlayer(fig.getUser()).removeMoney(this.val)) {
            TransactionAction transaction = new TransactionAction(fig.getUser(), this.val, false, fig.getUser());
            handler.addAction(transaction);
        } else {
            handler.kickPlayer(fig.getUser(), "lostNoMoneyLeft");
        }
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "val=" + this.val + '}';
    }
}

