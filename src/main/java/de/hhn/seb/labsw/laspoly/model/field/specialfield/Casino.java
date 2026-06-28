/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.AnchorPane
 */
package de.hhn.seb.labsw.laspoly.model.field.specialfield;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.Transactable;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.model.card.preview.CasinoPreviewCard;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.SpecialField;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import java.util.Locale;
import java.util.logging.Logger;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;

public class Casino
extends SpecialField
implements Transactable {
    public static final User CASINO_USER = new User("CASINO", Locale.ENGLISH);
    public static final int POSITION = 20;
    public static final int INITIAL_MONEY = 1200;
    private static Casino field;
    private final Logger logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
    private final CasinoPreviewCard previewCard = new CasinoPreviewCard(this);
    private int money = 1200;

    public Casino() {
        super(20);
        field = this;
    }

    public static Casino getField() {
        return field;
    }

    @Override
    public Card getPreviewCard() {
        return this.previewCard;
    }

    @Override
    public Card createNewPreviewCard() {
        return new CasinoPreviewCard(this);
    }

    @Override
    public String getName() {
        return GameScene.getResources().getString("casino_name");
    }

    @Override
    public void onFigureEntered(Figure fig, GameHandler handler) {
        Player player = handler.getPlayer(fig.getUser());
        int[] lastRoll = player.getLastRoll();
        if (lastRoll[0] >= 1 && lastRoll[0] == lastRoll[1]) {
            if (lastRoll[0] == 6) {
                player.addMoney(this.money / 2);
                TransactionAction transactionAdd = new TransactionAction(player.getUser(), this.money / 2, true, handler.getClientPlayer().getUser());
                handler.addAction(transactionAdd);
                TransactionAction transactionRemove = new TransactionAction(CASINO_USER, this.money / 2, false, handler.getClientPlayer().getUser());
                this.removeMoney(this.money / 2);
                handler.addAction(transactionRemove);
                return;
            }
            player.addMoney(this.money / 4);
            TransactionAction transactionAdd = new TransactionAction(player.getUser(), this.money / 4, true, handler.getClientPlayer().getUser());
            handler.addAction(transactionAdd);
            TransactionAction transactionRemove = new TransactionAction(CASINO_USER, this.money / 4, false, handler.getClientPlayer().getUser());
            this.removeMoney(this.money / 4);
            handler.addAction(transactionRemove);
        }
    }

    @Override
    public Group draw() {
        Group graphicsGroup = super.draw();
        ImageView imgV = new ImageView(DataLoader.getInstance().getGameImage(GameImage.IC_CASINO));
        imgV.setFitHeight(64.0);
        imgV.setFitWidth(64.0);
        EnhancedGroup imageGrp = new EnhancedGroup();
        AnchorPane pane = new AnchorPane(new Node[]{imgV});
        pane.setPrefWidth(100.0);
        pane.setPrefHeight(150.0);
        this.registerMouseCallbacks((Node)pane);
        imageGrp.getChildren().addAll(new Node[]{pane});
        imageGrp.setRz(180.0);
        imageGrp.setRx(270.0);
        imageGrp.setRy(45.0);
        imageGrp.setTz(40.0);
        imageGrp.setTy(11.0);
        graphicsGroup.getChildren().add(imageGrp);
        return graphicsGroup;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "previewCard=" + this.previewCard + ", money=" + this.money + '}';
    }

    public int getJackPot() {
        return this.getMoneyAmount() / 2;
    }

    public int getWinForDoubles() {
        return this.getMoneyAmount() / 4;
    }

    @Override
    public void addMoney(int amount) {
        this.logger.info("Added " + amount + "to casino");
        this.money += amount;
    }

    @Override
    public boolean removeMoney(int amount) {
        if (!this.enoughMoney(amount)) {
            this.logger.info("Casino has not enough money. This should never happen.");
            return false;
        }
        this.logger.info("Removed " + amount + " from casino.");
        this.money -= amount;
        return true;
    }

    @Override
    public int getMoneyAmount() {
        return this.money;
    }

    static {
        CASINO_USER.setId(-1000);
    }
}

