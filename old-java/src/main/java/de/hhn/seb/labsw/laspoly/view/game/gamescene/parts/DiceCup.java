/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.animation.Animation
 *  javafx.animation.ParallelTransition
 *  javafx.animation.RotateTransition
 *  javafx.animation.TranslateTransition
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.util.Duration
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene.parts;

import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.audio.Sound;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameSceneModelSource;
import de.hhn.seb.labsw.laspoly.view.game.GameController;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.parts.Dice;
import de.hhn.seb.labsw.laspoly.view.paint.Drawable;
import javafx.animation.Animation;
import javafx.animation.ParallelTransition;
import javafx.animation.RotateTransition;
import javafx.animation.TranslateTransition;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.util.Duration;

public class DiceCup
implements Drawable {
    private static int[] nextRolledNumber;
    private final EnhancedGroup cup;
    private final GameController controller;
    private final GameScene scene;
    private boolean animationPlaying;
    private Dice diceOne;
    private Dice diceTwo;
    private int activeCounter;
    private boolean diceActive;

    public DiceCup(GameController gameController, GameScene gameScene) {
        this.controller = gameController;
        this.scene = gameScene;
        this.animationPlaying = false;
        this.diceActive = false;
        this.activeCounter = 0;
        this.cup = DataLoader.getInstance().getGameSceneForm(GameSceneModelSource.DICE_CUP);
        this.cup.setRotate(360.0);
        this.cup.setRx(0.0);
        this.cup.setTy(230.0);
        this.cup.setTx(-250.0);
        this.cup.setTz(-250.0);
        this.cup.setScale(220.0);
        this.cup.setOnMouseClicked(t -> {
            if (this.activeCounter != 0 && !this.animationPlaying) {
                this.playAnimation();
                this.scene.getIndicator().hide();
                this.scene.getPlayerIndicator().hide();
                this.animationPlaying = true;
            }
        });
    }

    public static void setNextRolledNumbers(int[] num) {
        nextRolledNumber = num;
    }

    public void setDiceOne(Dice dice) {
        this.diceOne = dice;
        this.diceOne.draw().setOnMouseClicked(event -> {
            if (this.diceActive) {
                this.diceOne.draw().setCursor(Cursor.DEFAULT);
                this.diceTwo.draw().setCursor(Cursor.DEFAULT);
                this.diceActive = false;
                this.scene.setOnTurnDice();
            }
        });
    }

    public void setDiceTwo(Dice dice) {
        this.diceTwo = dice;
        this.diceTwo.draw().setOnMouseClicked(event -> {
            if (this.diceActive) {
                this.diceOne.draw().setCursor(Cursor.DEFAULT);
                this.diceTwo.draw().setCursor(Cursor.DEFAULT);
                this.diceActive = false;
                this.scene.setOnTurnDice();
            }
        });
    }

    public void playAnimation() {
        Sound.DICEROLLING.play();
        Duration sec2 = Duration.millis((double)2000.0);
        Duration sec4 = Duration.millis((double)4000.0);
        TranslateTransition ttup = new TranslateTransition(sec2);
        ttup.setFromY(0.0);
        ttup.setToY(350.0);
        ttup.setRate(32.0);
        ttup.setAutoReverse(true);
        RotateTransition rt = new RotateTransition(sec2);
        rt.setByAngle(40.0);
        rt.setCycleCount(8);
        rt.setRate(12.0);
        rt.setAutoReverse(true);
        TranslateTransition ttdown = new TranslateTransition(sec4, (Node)this.cup);
        ttdown.setFromY(350.0);
        ttdown.setToY(0.0);
        ttdown.setRate(16.0);
        ttdown.setAutoReverse(true);
        ParallelTransition pt = new ParallelTransition((Node)this.cup, new Animation[]{ttup, rt});
        pt.play();
        pt.setOnFinished(ae -> ttdown.play());
        ttdown.setOnFinished(event -> {
            this.diceOne.draw().setOpacity(1.0);
            this.diceTwo.draw().setOpacity(1.0);
            this.cup.setVisible(false);
            if (nextRolledNumber != null) {
                this.diceOne.roll(nextRolledNumber[0]);
                this.diceTwo.roll(nextRolledNumber[1]);
                nextRolledNumber = null;
            } else {
                this.diceOne.roll(-1);
                this.diceTwo.roll(-1);
            }
            this.controller.placeFigure(this.diceOne.getRolledNumber(), this.diceTwo.getRolledNumber());
            this.animationPlaying = false;
            --this.activeCounter;
        });
    }

    public void changeVisibility() {
        this.cup.setVisible(true);
        this.diceOne.draw().setOpacity(0.0);
        this.diceTwo.draw().setOpacity(0.0);
    }

    @Override
    public Node draw() {
        return this.cup;
    }

    public void setActive() {
        ++this.activeCounter;
        this.cup.setCursor(Cursor.HAND);
        this.changeVisibility();
    }

    public void setDiceActive() {
        this.diceOne.draw().setCursor(Cursor.HAND);
        this.diceTwo.draw().setCursor(Cursor.HAND);
        this.diceActive = true;
    }

    public void disableDices() {
        this.activeCounter = 0;
        this.cup.setCursor(Cursor.DEFAULT);
        this.changeVisibility();
    }
}

