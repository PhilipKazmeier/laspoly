/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.paint.Material
 *  javafx.scene.paint.PhongMaterial
 *  javafx.scene.shape.Box
 */
package de.hhn.seb.labsw.laspoly.model.card.action;

import de.hhn.seb.labsw.laspoly.exception.InvalidActionIdentifierException;
import de.hhn.seb.labsw.laspoly.model.card.AbsCardDeckNodeHolder;
import de.hhn.seb.labsw.laspoly.model.card.action.ActionCard;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.BroadcastTransactionActionCard;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.FactoryRepairActionCard;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.GeneralRepairActionCard;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.MoveActionCard;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.MoveForwardActionCard;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.MoveToNextTrainStationActionCard;
import de.hhn.seb.labsw.laspoly.model.card.action.actioncards.SingleTransactionActionCard;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.view.game.GameController;
import de.hhn.seb.labsw.laspoly.view.paint.Drawable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.logging.Logger;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.paint.Material;
import javafx.scene.paint.PhongMaterial;
import javafx.scene.shape.Box;

public class ActionCardDeck
implements Drawable {
    private static boolean moveActionActive = true;
    private final List<ActionCard> cards;
    private final NodeHolder nodes;
    private final Locale locale;
    private final Logger logger;
    private Runnable clickListener;

    public ActionCardDeck(Locale loc) {
        this.locale = loc;
        this.logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/game/gamescene/gamescene_logging.properties");
        this.nodes = new NodeHolder();
        this.cards = new ArrayList<ActionCard>();
    }

    public static void setMoveActionActive(boolean b) {
        moveActionActive = b;
    }

    public NodeHolder getNodes() {
        return this.nodes;
    }

    public void generateActionCards(GameController controller) {
        try {
            if (moveActionActive) {
                this.cards.add(new MoveActionCard(this.locale));
                this.cards.add(new MoveActionCard(this.locale, controller.getField(0)));
                this.cards.add(new MoveActionCard(this.locale, "jail", controller.getField(40)));
                this.cards.add(new MoveActionCard(this.locale, controller.getField(20)));
                this.cards.add(new MoveForwardActionCard(this.locale, "moveForward"));
                this.cards.add(new MoveToNextTrainStationActionCard(this.locale));
            }
            this.cards.add(new SingleTransactionActionCard(this.locale, "gamblingTax", false, 30));
            this.cards.add(new SingleTransactionActionCard(this.locale, "parkingFine", false, 20));
            this.cards.add(new SingleTransactionActionCard(this.locale, "helicopterFlight", false, 50));
            this.cards.add(new SingleTransactionActionCard(this.locale, "magicianShow", false, 15));
            this.cards.add(new SingleTransactionActionCard(this.locale, "independenceDay", false, 25));
            this.cards.add(new SingleTransactionActionCard(this.locale, "lookalikeCompetition", true, 25));
            this.cards.add(new SingleTransactionActionCard(this.locale, "yardSale", true, 30));
            this.cards.add(new SingleTransactionActionCard(this.locale, "inherit", true, 50));
            this.cards.add(new SingleTransactionActionCard(this.locale, "horseRacing", true, 40));
            this.cards.add(new SingleTransactionActionCard(this.locale, "slotMachine", true, 45));
            this.cards.add(new SingleTransactionActionCard(this.locale, "roulette", true, 30));
            this.cards.add(new SingleTransactionActionCard(this.locale, "boxingBet", true, 25));
            this.cards.add(new SingleTransactionActionCard(this.locale, "blackJack", true, 15));
            this.cards.add(new SingleTransactionActionCard(this.locale, "baccaratGame", true, 15));
            this.cards.add(new BroadcastTransactionActionCard(this.locale, "youGotPromoted", false, 20));
            this.cards.add(new BroadcastTransactionActionCard(this.locale, "birthday", true, 20));
            this.cards.add(new BroadcastTransactionActionCard(this.locale, "pokerTable", true, 25));
            this.cards.add(new FactoryRepairActionCard(this.locale, 10));
            this.cards.add(new GeneralRepairActionCard(this.locale, "generalRepairs", 5, false));
            this.cards.add(new GeneralRepairActionCard(this.locale, "streetRepairs", 5, true));
        }
        catch (InvalidActionIdentifierException e) {
            this.logger.severe("Couldn't generate all action cards");
        }
        Collections.shuffle(this.cards);
    }

    public void setOnClickListener(Runnable runnable) {
        this.clickListener = runnable;
    }

    public void add(ActionCard card) {
        this.cards.add(card);
    }

    public void remove(ActionCard card) {
        this.cards.remove(card);
    }

    public ActionCard pullCard() {
        return this.cards.get((int)(Math.random() * (double)this.cards.size()));
    }

    public List<ActionCard> getCards() {
        return this.cards;
    }

    @Override
    public Node draw() {
        return new Group((Node[])this.nodes.getCards());
    }

    private void onHoverStart() {
        for (Box card : this.nodes.getCards()) {
            card.setMaterial((Material)this.nodes.cardMaterialHover);
        }
    }

    private void onHoverEnd() {
        for (Box card : this.nodes.getCards()) {
            card.setMaterial((Material)this.nodes.cardMaterial);
        }
    }

    private void onMouseClick() {
        if (this.clickListener != null) {
            this.clickListener.run();
        }
    }

    public String toString() {
        return this.getClass().getName() + "{" + "cards=" + this.cards + ", nodes=" + this.nodes + ", locale=" + this.locale + ", clickListener=" + this.clickListener + '}';
    }

    public class NodeHolder
    extends AbsCardDeckNodeHolder {
        private final PhongMaterial cardMaterial;
        private final PhongMaterial cardMaterialHover;

        public NodeHolder() {
            super(25, 200, 100);
            this.cardMaterial = de.hhn.seb.labsw.laspoly.view.paint.Material.textured(DataLoader.getInstance().getGameImage(GameImage.CARD_PATTERN));
            this.cardMaterialHover = de.hhn.seb.labsw.laspoly.view.paint.Material.textured(DataLoader.getInstance().getGameImage(GameImage.CARD_PATTERN_HOVER));
            Arrays.stream(this.getCards()).forEach(card -> {
                card.setMaterial((Material)this.cardMaterial);
                card.setOnMouseEntered(e -> ActionCardDeck.this.onHoverStart());
                card.setOnMouseExited(e -> ActionCardDeck.this.onHoverEnd());
                card.setOnMouseClicked(e -> ActionCardDeck.this.onMouseClick());
            });
        }

        @Override
        public String toString() {
            return this.getClass().getName() + "{" + "cardMaterial=" + this.cardMaterial + ", cardMaterialHover=" + this.cardMaterialHover + '}';
        }
    }
}

