/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.card.action;

import de.hhn.seb.labsw.laspoly.model.card.action.ActionCard;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.util.Locale;

public abstract class MultipleOptionActionCard
extends ActionCard {
    private final String identifierOne;
    private final String identifierTwo;

    public MultipleOptionActionCard(Locale loc, String identifier, String identOptOne, String identOptTwo) {
        super(loc, identifier);
        this.identifierOne = identOptOne;
        this.identifierTwo = identOptTwo;
        this.getOptionOne().setVisible(true);
        this.getOptionTwo().setVisible(true);
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "identifierOne='" + this.identifierOne + '\'' + ", identifierTwo='" + this.identifierTwo + '\'' + '}';
    }

    @Override
    public final void activate(Figure fig, GameHandler handler) {
        this.prepare(handler);
        handler.showActionCard(this);
        this.getOptionOne().setOnAction(ev -> {
            handler.hideActionCard(this);
            this.onActionOne(fig, handler);
        });
        this.getOptionTwo().setOnAction(ev -> {
            handler.hideActionCard(this);
            this.onActionTwo(fig, handler);
        });
    }

    @Override
    protected void prepare(GameHandler handler) {
        this.getOptionOne().setText(this.getBundle().getString(this.getIdentifierOne()));
        this.getOptionTwo().setText(this.getBundle().getString(this.getIdentifierTwo()));
    }

    protected abstract void onActionOne(Figure var1, GameHandler var2);

    protected abstract void onActionTwo(Figure var1, GameHandler var2);

    protected String getIdentifierOne() {
        return this.identifierOne;
    }

    protected String getIdentifierTwo() {
        return this.identifierTwo;
    }
}

