/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.action.actioncards;

import de.hhn.seb.labsw.laspoly.exception.InvalidActionIdentifierException;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.RepairTransactionActionCard;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.util.Locale;

public class FactoryRepairActionCard
extends RepairTransactionActionCard {
    private int val = -1;

    public FactoryRepairActionCard(Locale loc, int multiplier) throws InvalidActionIdentifierException {
        super(loc, "factoryRedevelop", multiplier);
    }

    @Override
    protected void onAction(Figure fig, GameHandler handler) {
        this.val *= handler.getPlayer(fig.getUser()).getAllFactories().size();
        if (this.val > 0) {
            if (handler.getPlayer(fig.getUser()).removeMoney(this.val)) {
                TransactionAction transaction = new TransactionAction(fig.getUser(), this.val, false, fig.getUser());
                handler.addAction(transaction);
            } else {
                handler.kickPlayer(fig.getUser(), "lostNoMoneyLeft");
            }
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
    public String toString() {
        return this.getClass().getName() + "{" + "val=" + this.val + '}';
    }
}

