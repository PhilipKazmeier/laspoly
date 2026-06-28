/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.action.actioncards;

import de.hhn.seb.labsw.laspoly.exception.InvalidActionIdentifierException;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.card.action.ActionCard;
import de.hhn.seb.labsw.laspoly.model.card.action.MultipleOptionActionCard;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.util.Locale;
import java.util.Random;

public class AnotherCardTransactionActionCard
extends MultipleOptionActionCard {
    private final int multiplier;
    private int val = -1;

    public AnotherCardTransactionActionCard(Locale loc, int multiplierVal) throws InvalidActionIdentifierException {
        super(loc, "anotherCardTransaction", "optionCard", "optionMoney");
        this.multiplier = multiplierVal;
        if (!this.getBundle().getString(this.getIdentifier()).contains("%d")) {
            throw new InvalidActionIdentifierException("%d");
        }
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "multiplier=" + this.multiplier + ", val=" + this.val + '}';
    }

    @Override
    protected void prepare(GameHandler handler) {
        super.prepare(handler);
        Random random = new Random();
        this.val = (random.nextInt(5) + 1) * this.multiplier;
        String text = String.format(this.getBundle().getString(this.getIdentifier()), this.val);
        this.getActionCardText().setText(text);
        this.setValues(this.val);
    }

    @Override
    protected void onActionOne(Figure fig, GameHandler handler) {
        ActionCard card = handler.drawCard();
        card.activate(fig, handler);
    }

    @Override
    protected void onActionTwo(Figure fig, GameHandler handler) {
        if (handler.getPlayer(fig.getUser()).removeMoney(this.val)) {
            TransactionAction transaction = new TransactionAction(fig.getUser(), this.val, false, fig.getUser());
            handler.addAction(transaction);
        } else {
            handler.kickPlayer(fig.getUser(), "lostNoMoneyLeft");
        }
    }
}

