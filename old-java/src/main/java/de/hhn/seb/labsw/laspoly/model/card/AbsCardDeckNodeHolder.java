/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.geometry.Point3D
 *  javafx.scene.shape.Box
 */
package de.hhn.seb.labsw.laspoly.model.card;

import de.hhn.seb.labsw.laspoly.view.paint.AbsNodeHolder;
import java.util.Arrays;
import java.util.Random;
import javafx.geometry.Point3D;
import javafx.scene.shape.Box;

public class AbsCardDeckNodeHolder
implements AbsNodeHolder {
    private final int cardWidth;
    private final int cardDepth;
    private Box[] cards;

    public AbsCardDeckNodeHolder(int numCards, int width, int depth) {
        this.cardWidth = width;
        this.cardDepth = depth;
        this.setNumCards(numCards);
    }

    public void setNumCards(int numCards) {
        Random random = new Random();
        this.cards = new Box[numCards];
        double y = 0.0;
        for (int i = 0; i < this.cards.length; ++i) {
            this.cards[i] = new Box((double)this.cardWidth, 1.0, (double)this.cardDepth);
            this.cards[i].setTranslateX((double)(random.nextInt(6) - 3));
            this.cards[i].setTranslateZ((double)(random.nextInt(6) - 3));
            this.cards[i].setTranslateY(y);
            if (i != 0 && i != this.cards.length - 1) {
                this.cards[i].setRotationAxis(new Point3D(0.0, 1.0, 0.0));
                this.cards[i].setRotate((double)(random.nextInt(10) - 5));
            }
            y += 1.1;
        }
    }

    public Box getUppermostCard() {
        if (this.cards.length == 0) {
            return null;
        }
        return this.cards[this.cards.length - 1];
    }

    public Box[] getCards() {
        return this.cards;
    }

    @Override
    public double getBottomHeight() {
        return this.cards[0].getHeight() * (double)this.cards.length;
    }

    public String toString() {
        return this.getClass().getName() + "{" + "cardWidth=" + this.cardWidth + ", cardDepth=" + this.cardDepth + ", cards=" + Arrays.toString(this.cards) + '}';
    }
}

