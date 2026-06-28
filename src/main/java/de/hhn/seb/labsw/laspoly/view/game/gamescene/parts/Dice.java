/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Group
 *  javafx.scene.Node
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene.parts;

import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameSceneModelSource;
import de.hhn.seb.labsw.laspoly.view.paint.Drawable;
import java.util.Random;
import javafx.scene.Group;
import javafx.scene.Node;

public class Dice
implements Drawable {
    private final EnhancedGroup dice;
    private final Group diceGroup = new Group();
    private final Random rand;
    private int rolledNumber;

    public Dice(GameSceneModelSource source) {
        this.dice = DataLoader.getInstance().getGameSceneForm(source);
        this.dice.setRotate(360.0);
        this.dice.setScale(20.0);
        this.dice.setTx(-250.0);
        this.rand = new Random();
        if (source == GameSceneModelSource.DICE_1) {
            this.dice.setTz(-190.0);
        } else if (source == GameSceneModelSource.DICE_2) {
            this.dice.setTz(-330.0);
        } else {
            throw new InvalidParameterException("The given source should be DICE_1 or DICE_2.", "source", source);
        }
        this.dice.setTy(40.0);
    }

    public void roll(int rolled) {
        this.diceGroup.getChildren().remove(this.dice);
        this.rolledNumber = rolled == -1 ? this.rand.nextInt(6) + 1 : rolled;
        this.dice.setRx(0.0);
        this.dice.setRy(0.0);
        this.dice.setRz(0.0);
        this.dice.setTy(20.0);
        switch (this.rolledNumber) {
            case 1: {
                this.dice.setRx(90.0);
                this.dice.setRz(20.0);
                this.dice.setTy(20.0);
                break;
            }
            case 2: {
                this.dice.setRy(20.0);
                this.dice.setRz(90.0);
                this.dice.setTy(20.0);
                break;
            }
            case 3: {
                this.dice.setRx(180.0);
                this.dice.setRz(0.0);
                this.dice.setTy(0.0);
                break;
            }
            case 4: {
                this.dice.setRx(0.0);
                this.dice.setRz(0.0);
                this.dice.setTy(40.0);
                break;
            }
            case 5: {
                this.dice.setRy(20.0);
                this.dice.setRz(270.0);
                this.dice.setTy(20.0);
                break;
            }
            case 6: {
                this.dice.setRx(270.0);
                this.dice.setRz(-20.0);
                this.dice.setTy(20.0);
                break;
            }
        }
        this.diceGroup.getChildren().add(this.dice);
    }

    public int getRolledNumber() {
        return this.rolledNumber;
    }

    @Override
    public Node draw() {
        return this.diceGroup;
    }
}

